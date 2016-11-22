
var Promise = require('bluebird');
var _ = require("lodash");
var splunkjs = require('splunk-sdk');

var debug = require('debug')('splunk-provision-restinput')

var pkg = require('./package.json');

var  yargs = require('yargs');

var DEV=false

var args = yargs
    .usage(pkg.description + "\n\n$0 --url [api endpoint] --name [splunk name] --host [host]")
    .version(pkg.version, 'version')
    .demand('n')
    .alias('n', 'name')
    .describe('n', 'Name for the rest modular input')
    .demand('r')
    .alias('r', 'url')
    .describe('r', 'URL for the api')

    .demand('t')
    .alias('t', 'reportedHost')
    .describe('t', 'Host that the test results will be reported against')

    .demand('u')
    .alias('u', 'username')
    .describe('u', 'Splunk User Name')
    .demand('p')
    .alias('p', 'password')
    .describe('p', 'Splunk Password')
    .demand('s')
    .alias('s', 'splunkHost')
    .describe('s', 'Splunk Host that input will be registered at')

    .alias('c', 'clean')
    .describe('c', 'Clean existing')
    .parse(process.argv);

var service=null;
var restInputs=null;

splunkjs.Service.RestInput = splunkjs.Service.Entity.extend({
    path: function() {
        return  "data/inputs/rest/" + encodeURIComponent(this.name);
    },

    init: function(service, name, namespace) {
        this.name = name;
        this._super(service, this.path(), namespace);
    }
});

splunkjs.Service.RestInputs = splunkjs.Service.Collection.extend({
    fetchOnEntityCreation: true,

    path: function() {
        return "data/inputs/rest/";
    },

    instantiateEntity: function(props) {
        var entityNamespace = splunkjs.Utils.namespaceFromProperties(props);
        return new splunkjs.Service.RestInput(this.service, props.name, entityNamespace);
    },

    init: function(service, namespace) {
        this._super(service, this.path(), namespace);
    }
});

splunkjs.Service.prototype.restInputs = function(namespace) {
    return new splunkjs.Service.RestInputs(this, namespace);
};

function init(){
  return new Promise(function(resolve,reject){
    debug("init");
    service = new splunkjs.Service({
      host: args.splunkHost,
      // port: 8000,
      // scheme: "http",
      // version: "5.0",
      username: args.username,
      password: args.password
    });
    resolve();
  })
}

function login() {
  return new Promise(function(resolve,reject){
    debug("login");
    if(DEV)
      resolve();
    else{
      service.login(function(err, success) {
          // We check for both errors in the connection as well
          // as if the login itself failed.
          if (err || !success) {
              console.log("Error in logging in");
              console.log(err);
              reject();
          }else {
            resolve();
          }
      });
    }
  });
}

function setup(){
    return new Promise(function(resolve,reject){
      debug("setup");
      restInputs = service.restInputs({user:"admin", app: "launcher"});
      resolve();
    });
};

function create(){
    return new Promise(function(resolve,reject){
        debug("create");
        if(DEV){
          debug("create done");
          resolve();
        }else {
          restInputs.create({
              name: args.name,
              host: args.reportedHost,
              endpoint: args.url,
              response_type: 'json',
              http_method: 'GET',
              response_filter_pattern: '.*',
              request_timeout: 20,
              sourcetype: '_json',
              polling_interval: 60,
              index: 'int-prod',
              auth_type: 'none'
          },function(err,createdInput){
              if(err){
                console.log(err);
                reject(err);
              }else {
                resolve();
              }
          });
        }
      });
}

function remove(){
    return new Promise(function(resolve,reject){
      debug("remove");
      if(DEV){
        resolve();
      }else {
        if(args.clean){                
          existing.del("",{                         
          },function(err,createdInput){
              if(err){
                console.log(err);
                reject(err);
              }else {
                resolve();
              }
          });
        }
      }
    });
}


var existing = null;
function fetch(){
    return new Promise(function(resolve,reject){
      debug("fetch");
      if(DEV){
        debug("fetch2");
        resolve();
      }  else {
        restInputs.fetch(function(rolesErr, roles) {
            if (rolesErr) {
                console.log("There was an error retrieving the list of restInputs:", rolesErr);
                reject();
            }else {
              console.log("System rest:");
              var rolesList = roles.list();
              for (var i = 0; i < rolesList.length; i++) {
                  var r = rolesList[i];
                  var p = r.properties();
                  console.log("  " + i + " " + r.name + " "+ p.sourcetype + " "+ p.index );
                  if(r.name === args.name){
                    console.log("Found existing");
                    existing = r;
                  }                    
              }
              resolve();
            }
        });
      }
    });
};

init()
.then(login)
.then(setup)
.then(fetch)
.then(remove)
.then(create)
.then(function() {
  console.log("Done");
})
.catch(function(err){
  console.log("Failure");
  console.log(err);
})
