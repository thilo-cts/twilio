 angular.module('agent', []).controller('agentLoginController', ['$scope', '$http', function($scope, $http) {
     console.log("workernae", $scope.workerName);
     $scope.welcomeMsg = "Agent Login";
     $scope.notLogin = true;
     $scope.errorMessage = '';
     $scope.log = '';
     $scope.initiateTwilio = function() {
         console.log("workernae", $scope.workerName);

         $http({
             method: 'POST',
             url: 'http://twilio-client-thilojith.c9users.io/getToken',
             data: {
                 workerName: $scope.workerName
             }
         }).then(function successCallback(response) {
             console.log("...", response.data);
             response = response.data;
             $scope.welcomeMsg = "Welcome " + response.worker.friendly_name + "!";
             $scope.notLogin = false;
            $("#log").text("Connecting to Twilio..");
             $scope.errorMessage = '';
             setUpToken(response.token);
         }, function errorCallback(response) {
             console.log(response);
             $scope.errorMessage = response.data.errormessage;
         })
     }

     function setUpToken(token) {
        // $scope.log = token;
         Twilio.Device.setup(token, {
             'debug': true
         });
     }
    // console.log("Twilio",Twilio);
         Twilio.Device.ready(function(device) {
             $("#log").text("Ready");
         });

         Twilio.Device.error(function(error) {
             $("#log").text("Error: " + error.message);
         });

         Twilio.Device.connect(function(conn) {
              $("#log").text("Successfully established call");
         });

     Twilio.Device.incoming(function(connection) {
         if (confirm('Accept incoming call from ' + connection.parameters.From + '?')) {
             //connection.accept();
             // reload ...
             
         }
         else {
             connection.reject();
         }
     });



 }]);