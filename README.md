firerunner
==========

Firebug extension intended to open source files of web pages in running IDE like
eclipse, IntelliJ IDEA or another editor. It is very effective especially 
for large single-page projects. 
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


- extensions.firebug.firerunner.paramTagAttribute : name of attribute of info 
  tag where the file name (or another information) is stored

    default value: **title**

- extensions.firebug.firerunner.execCmd : command to be executed
    
  default value: **eclipse**

- extensions.firebug.firerunner.paramRegExp: regular expression intended 
  used to extract file name from paramTagAttribute. Extracted value is
  passed to execute parameter formatter.
    
    default value: **view:(.*)**
- extensions.firebug.firerunner.execParam: parameter of executable command.
  {0} is replaced by value extracted from patamTagAttribute using regular 
  expression paramRegExp.

  default value: **--launcher.openFile /home/lada/workspace/project/web/{0}**
