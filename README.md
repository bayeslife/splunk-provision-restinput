# splunk-provision-restinput
Create a Rest Modular Input in Splunk corresponding to an API

Goes through a process of retrieve the rest inputs
deleting the input with name if it exists
creates the input

Sample command line
```
DEBUG=splunk-provision-restinput node restapis.js --name healthcheck1 --url http://localhost:1080/api/healthcheck  --username <username> --password <password> --splunkHost "splunkserver.net" --reportedHost "sourcehost" --clean true
```
