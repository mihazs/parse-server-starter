// Example express application adding the parse-server module to expose Parse
// compatible API routes.

var express = require('express');
const { default: ParseServer, ParseGraphQLServer } = require('parse-server');
var ParseDashboard = require('parse-dashboard');
var path = require('path');

var databaseUri = process.env.DATABASE_URI || process.env.MONGODB_URI;

if (!databaseUri) {
  console.log('DATABASE_URI not specified, falling back to localhost.');
}
const fileAdapter = 
(process.env.S3_ACCESS_KEY && process.env.S3_SECRET_KEY && process.env.S3_BUCKET) ?
  {filesAdapter: new S3Adapter(
  "S3_ACCESS_KEY",
  "S3_SECRET_KEY",
  "S3_BUCKET",
  {directAccess: true}
)} : {};
var options = { allowInsecureHTTP: true };
var dashboard = new ParseDashboard({
  "apps": [
    {
      "serverURL": process.env.SERVER_URL || `http://localhost:${process.env.PORT || 1337}/parse`,
      "appId": process.env.APP_ID || 'myAppId',
      "masterKey": process.env.MASTER_KEY || '',
      "appName": process.env.APP_NAME || "MyApp",
      "graphQLServerURL": process.env.GRAPHQL_URL || `http://localhost:${process.env.PORT || 1337}/graphql`,
    }
  ],
  "users": [
    {
      "user": process.env.DASHBOARD_USER || "root",
      "pass": process.env.DASHBOARD_PASSWORD || "toor"
    }
  ]
}, options);
var api = new ParseServer({
  databaseURI: databaseUri || 'mongodb://localhost:27017/dev',
  appName: process.env.APP_NAME || "MyApp",
  cloud: process.env.CLOUD_CODE_MAIN || __dirname + '/cloud/main.js',
  appId: process.env.APP_ID || 'myAppId',
  masterKey: process.env.MASTER_KEY || '', //Add your master key here. Keep it secret!
  serverURL: process.env.SERVER_URL || `http://localhost:${process.env.PORT || 1337}/parse`,
  javascriptKey: process.env.JAVASCRIPT_KEY || '',
  ...fileAdapter
});
const parseGraphQLServer = new ParseGraphQLServer(
  api,
  {
    graphQLPath: '/graphql',
  }
);
// Client-keys like the javascript key or the .NET key are not necessary with parse-server
// If you wish you require them, you can set them as options in the initialization above:
// javascriptKey, restAPIKey, dotNetKey, clientKey

var app = express();


// Serve the Parse API on the /parse URL prefix
var mountPath = process.env.PARSE_MOUNT || '/parse';
app.use(mountPath, api.app);
parseGraphQLServer.applyGraphQL(app); // Mounts the GraphQL API

app.use(process.env.DASHBOARD_MOUNT || '/dashboard', dashboard);



// There will be a test page available on the /test path of your server url
// Remove this before launching your app
/*app.get('/test', function(req, res) {
  res.sendFile(path.join(__dirname, '/public/test.html'));
});*/

var port = process.env.PORT || 1337;
var httpServer = require('http').createServer(app);
httpServer.listen(port, function() {
    console.log('parse-server-example running on port ' + port + '.');
});

// This will enable the Live Query real-time server
ParseServer.createLiveQueryServer(httpServer);
