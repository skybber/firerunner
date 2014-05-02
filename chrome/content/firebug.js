/*global FBL */
FBL.ns(function () {
	with (FBL) {
		var panelName = "firerunner",
			regExpIsXPath = /^\//,
			regExpClass = /\s?firerunner\-match(\-hover)?/g,
			regExpHoverClass = /firerunner\-match\-hover/,
			regExpInitialViewClass = /initial\-view/,
			regExpRunner = /firerunner\-run\-element/,
			regExpSpaceFix = /^\s+|\s+$/g,
			regExpSlashEscape = /\//g,
			inputField = null,
			results = null,
			resultsHeader = null,
			statesFirerunner = {
			},
			strBundle = document.getElementById("firerunnerstrings"),
			translations = {
				firerunnerfindmatchingelements : strBundle.getString("firerunnerfindmatchingelements"),
				firerunnermatchingelements : strBundle.getString("firerunnermatchingelements"),
				firerunnernomatches : strBundle.getString("firerunnernomatches"),
				firerunnerfilter : strBundle.getString("firerunnerfilter"),
				firerunnerExecute: strBundle.getString("firerunnerexecute"),
			},  
			getTabIndex = function () {
				var browsers = FBL.getTabBrowser().browsers,
					tabIndex;
				for (var i=0, il=browsers.length; i<il; i++) {
					if(FBL.getTabBrowser().getBrowserAtIndex(i).contentWindow == content) {
						tabIndex = i;
						break;
					}
				}
				return tabIndex;
			},
			getFirerunnerState = function () {
			    var tabIndex = getTabIndex(),
			        state = statesFirerunner[tabIndex],
			        matchingElementsExists = false;


			    try {
			        matchingElementsExists = state.matchingElements.length + "";
			    } catch(e) {}

			    if (!state || !matchingElementsExists) {
			        state = statesFirerunner[tabIndex] = {
			            matchingElements : []
			        };
			    }   

			    return state;   
			};

		
		Firebug.firerunnerModel = extend(Firebug.Module, {
			baseContentAdded : false,
			showPanel : function(browser, panel) {
				var isPanel = panel && panel.name === panelName, 
					firerunnerButtons = Firebug.chrome.$("fbfirerunnerButtons"),
					state = getFirerunnerState();
			},
		
			addBaseContent : function (panelNode) {
				var baseContent = domplate({
						panelBase:
						DIV({
								id : "firerunner-container"
							},
							DIV({
									id: "firerunner-base-content"
								},
								H1(
									{},
									SPAN({
										},
										"Firerunner"
									),
									SPAN({
											id : "firerunner-help-text"
										},
										" - " + translations.firerunnerfindmatchingelements
									)
								),
								DIV(
									{
										id: "firerunner-search-box"
									},
									INPUT(
										{
											class : "firerunner-field",
											type : "text",
											value: Firebug.getPref(Firebug.prefDomain, "firerunner.filter"),
											onkeypress : function (evt) {
												if (evt.keyCode === 13) {
													Firebug.firerunnerModel.run(Firebug.currentContext);
												}
											}
										}
									),
									INPUT(
										{
											id : "firerunner-css-button",
											type : "button",
											value : translations.firerunnerfilter,
											onclick : function () {
												Firebug.firerunnerModel.run(Firebug.currentContext);
											}
										}
									)
								)
							),
							DIV(
								{
									class : "firerunner-results-container initial-view"
								},
								H2({
										class : "firerunner-results-header"
									},
									translations.firerunnermatchingelements
								),
								DIV(
									{
										class : "firerunner-results"
									},
									translations.nomatches
								)
							)
						)
					});
				baseContent.panelBase.replace({}, panelNode, baseContent);
			},
		
			addStyleSheet : function (doc) {
				var styleSheet = document.getElementById("firerunner-firebug-style");
				if (!styleSheet) {
					styleSheet = createStyleSheet(doc, "chrome://firerunner/skin/firebug.css");
					styleSheet.id = "firerunner-firebug-style";
					addStyleSheet(doc, styleSheet);
				}
			},
			
		   	run : function (context, element) {
				var panel = context.getPanel(panelName),
					panelNode = panel.panelNode,
					inputField = dLite.elmsByClass("firerunner-field", "input", panelNode)[0],
					resultsContainer = dLite.elmsByClass("firerunner-results-container", "div", panelNode)[0],
					results = dLite.elmsByClass("firerunner-results", "div", panelNode)[0],
					resultsHeader = dLite.elmsByClass("firerunner-results-header", "h2", panelNode)[0],
					execCmd = Firebug.getPref(Firebug.prefDomain, "firerunner.execCmd"),
					execParam = Firebug.getPref(Firebug.prefDomain, "firerunner.execParam"),
					paramRegExp = new RegExp(Firebug.getPref(Firebug.prefDomain, "firerunner.paramRegExp")),
					paramTagAttribute = Firebug.getPref(Firebug.prefDomain, "firerunner.paramTagAttribute"),

					// JavaScript and CSS to add to the web browser content
					currentDocument = Firebug.currentContext.window.document,
					cssApplied = currentDocument.getElementById("firerunner-css"),
					head,
					css,
					
					// Parse HTML elements
					parse = function () {
						// CSS/XPath to filter by
						var filterExpression = inputField.value,
							XPath = regExpIsXPath.test(filterExpression),
							resultItem = "",
							state = Firebug.firerunnerModel.clear(context),
							matchingElements,
							firerunnerResultItems;
						
						// Find matching elements
						if (typeof element !== "undefined") {
							matchingElements = [element];
						}
						else if (XPath) {
							matchingElements = [];
							var xPathNodes = currentDocument.evaluate(filterExpression, currentDocument, ((currentDocument.documentElement.namespaceURI === ns.xhtml)? "xhtml:" : null), 0, null), node;
							while ((node = xPathNodes.iterateNext())) {
								matchingElements.push(node);
							}
						}
						else {
							matchingElements = new XPCNativeWrapper(Firebug.currentContext.window).document.querySelectorAll(filterExpression.replace(regExpSlashEscape, "\\\/"));
						}

						// Clear results content
						results.innerHTML = "";
						
						// Add class to matching elements and clone them to the results container
						if (matchingElements.length > 0) {
							for (var j=0, jl=matchingElements.length, elm, nodeNameValue, nodeNameCode, k, kl, attr; j<jl; j++) {
								elm = matchingElements[j];
								nodeNameValue = elm.nodeName.toLowerCase();
								nodeNameCode = "<span class='node-name'>" + nodeNameValue + "</span>";

								// Each element match container
								var firerunnerElement = document.createElement("div");
								firerunnerElement.className = "firerunner-result-item" + ((j % 2 === 0)? " odd" : "");
								firerunnerElement.ref = j;

								// Run element link
								var firerunnerExecElement = document.createElement("div");
								firerunnerExecElement.className = "firerunner-run-element";
								var paramAttrValue = elm.getAttribute(paramTagAttribute);
								var paramCmdLabel = document.createTextNode(paramAttrValue);
								firerunnerExecElement.appendChild(paramCmdLabel);
								firerunnerElement.appendChild(firerunnerExecElement);

								results.appendChild(firerunnerElement);
								elm.className += ((elm.className.length > 0)? " " : "") + "firerunner-match";
							}
						}
						else {
							var noMatches = document.createTextNode(translations.firerunnernomatches);
							results.appendChild(noMatches);
						}
						
						state.matchingElements = matchingElements;
						
						firerunnerResultItems = dLite.elmsByClass("firerunner-result-item", "div", results);
						for (var l=0, ll=firerunnerResultItems.length, matchingElm; l<ll; l++) {
							elm = firerunnerResultItems[l];
							if (elm.getAttribute("ref")) {
								elm.addEventListener("mouseover", function (evt) {
									state.matchingElements[this.getAttribute("ref")].className += " firerunner-match-hover";
								}, false);
							
								elm.addEventListener("mouseout", function (evt) {
									matchingElm = state.matchingElements[this.getAttribute("ref")];
									matchingElm.className = matchingElm.className.replace(regExpHoverClass, "").replace(regExpSpaceFix, "");
								}, false);
								
								elm.addEventListener("click", function (evt) {
									var targetClassName = evt.target.className;
									if (regExpRunner.test(targetClassName)) {
										var paramTagAttrValue, execArg, match;
										matchingElm = state.matchingElements[this.getAttribute("ref")];
										paramTagAttrValue = matchingElm.getAttribute(paramTagAttribute);
										match = paramRegExp.exec(paramTagAttrValue); 
										if (match != null) {
											execArg = match[1];
											if (execArg != null) {
												var parametrizedExecParamArg = execParam.replace("{0}", execArg);
												var execParamArray = parametrizedExecParamArg.split(" ");
												var apt_list = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
												apt_list.initWithPath(execCmd);
												var process = Components.classes["@mozilla.org/process/util;1"].
												createInstance(Components.interfaces.nsIProcess);
												process.init(apt_list);
												process.run(false, execParamArray, execParamArray.length);
											}
										}
									}
								}, false);
							}
						}
						// resultsHeader.innerHTML = translations.firerunnermatchingelements + ": " + matchingElements.length;
						var paramCmdLabel = document.createTextNode(translations.firerunnermatchingelements + ": " + matchingElements.length);
						resultsHeader.appendChild(paramCmdLabel);
						resultsContainer.className = resultsContainer.className.replace(regExpInitialViewClass, "").replace(regExpSpaceFix, "");
					};
															
					if (!cssApplied) {
						head = currentDocument.getElementsByTagName("head")[0];						
						css = new XPCNativeWrapper(Firebug.currentContext.window).document.createElement("link");
						css.id = "firerunner-css";
						css.type = "text/css";
						css.rel = "stylesheet";
						css.href = "chrome://firerunner/content/browser.css";
						head.appendChild(css);
					}
					parse();
			},
		
			show : function (context) {
				// Forces Firebug to be shown, even if it's off
				Firebug.toggleBar(true);
				Firebug.toggleBar(true, panelName);
				if (Firebug.currentContext) {
					var panel = Firebug.currentContext.getPanel(panelName);
					var inputField = dLite.elmsByClass("firerunner-field", "input", panel.panelNode)[0];
					inputField.select();
					inputField.focus();
				}
			},
		
			hide : function (context) {
				Firebug.toggleBar(false, panelName);
			},
		
			selectCurrentElm : function (evt) {
				Firebug.firerunnerModel.run(Firebug.currentContext, evt.target);
				if (evt.type === "click") {
					evt.preventDefault();
				}
			},
			
			clear : function (context) {
				var panel = Firebug.currentContext.getPanel(panelName),
					panelNode = panel.panelNode,
					state = getFirerunnerState(),
					resultsContainer = dLite.elmsByClass("firerunner-results-container", "div", panelNode)[0],
					matchingElements;
					
				resultsContainer.className = "firerunner-results-container initial-view";
				matchingElements = state.matchingElements;
				
				// Clear previosuly matched elements' CSS classes	
				for (var i=0, il=matchingElements.length, elm; i<il; i++) {
					elm = matchingElements[i];
					try {
						elm.className = elm.className.replace(regExpClass, "").replace(regExpSpaceFix, "");
						if (elm.className.length === 0) {
							elm.removeAttribute("class");
						}
					} catch(e) {}
				}				
				return state;		
			}
		});
			
		
		function firerunnerPanel () {
		}
		firerunnerPanel.prototype = extend(Firebug.Panel, {
			name : panelName,
			title : "Firerunner",
			initialize : function () {
				Firebug.Panel.initialize.apply(this, arguments);
				Firebug.firerunnerModel.addStyleSheet(this.document);
				Firebug.firerunnerModel.addBaseContent(this.panelNode);
			},
			
			getOptionsMenuItems : function () {				
				return [];
			},
			
			optionsMenuItem : function  (text, option) {
				var pref = Firebug.getPref(Firebug.prefDomain, option);
				return {
					label : text,
					type : "checkbox",
					checked : pref,
					command : bindFixed(Firebug.setPref, this, Firebug.prefDomain, option, !pref)
				};
			}
		});
		
		Firebug.registerModule(Firebug.firerunnerModel);
		Firebug.registerPanel(firerunnerPanel);
	}
});
