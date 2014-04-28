firerunner
==========

Firebug extension for external application lunching. Firerunner is derived 
from Firefinder extension. Firerunner was originally intended to open 
XHTML source files in Eclipse, NetBeans, IntelliJ IDEA or other editors. 
It is very effective especially for large single-page projects. 
  Extension can be parametrized to execute anything with whatever argument so 
another usecases can be found.

Mechanism: 

1. Information about the source file is stored in HTML info tag (DIV is 
suggested). DIV has zero size so it does not destroy the page layout. DIV 
must be marked to be found by provided XPATH query (marking by property 
class is suggested). Multiple info tags can be placed on the page.
Following form of info element is expected by default:

```html
    <div title="view:<path-to-source-file>" class="viewInfo">
```
2. Use "Filter" button of Firerunner extension to find info tags.
3. Click on the found link to open source file in specified editor/IDE.


Configuration parameters:

- extensions.firebug.firerunner.filter: Xpath filter used to find info tags.

    default value: **//div[contains(@class,'viewInfo')]**


- extensions.firebug.firerunner.paramAttribute : name of attribute of info 
  tag where the file name (or another information) is stored

    default value: **title**

- extensions.firebug.firerunner.execCmd : command to be executed
    
  default value: **eclipse**

- extensions.firebug.firerunner.paramFunc : body of the javascript function 
  returning argument that is passed to executed command. ParamAttribute value
  is passed by variable "x".

    default value: 
```js
return '--launcher.openFile /project_path/' + x.substr(5);
```
