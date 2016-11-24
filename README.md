# splunk-provision-restinput
Create a Rest Modular Input in Splunk corresponding to an API

Goes through a process to retrieve the rest module inputs from the splunk server
Determines if the particular input (by name) exists
Deleting the input if it exists
Creates the input

Sample command line
```
DEBUG=splunk-provision-restinput node restapis.js --name healthcheck1 --url http://localhost:1080/api/healthcheck  --username <username> --password <password> --splunkHost "splunkserver.net" --reportedHost "sourcehost" --clean true --add true
```
