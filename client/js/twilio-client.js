 angular.module('agent', []).controller('agentLoginController', ['$scope', '$http', function($scope, $http) {
     console.log("workernae", $scope.workerName);
     $scope.welcomeMsg = "Agent Login";
     $scope.notLogin = true;
     $scope.errorMessage = '';
     $scope.log = '';
     $scope.loggedIn = false;
     $scope.initiateTwilio = function() {
         console.log("workernae", $scope.workerName);

         $http({
             method: 'POST',
             url: '/getToken',
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
             $scope.loggedIn = true;
             $scope.retriveData('+19733689700');
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
             connection.accept();
             // reload ...
             
         }
         else {
             connection.reject();
         }
     });


var serverUrl= "https://utilities360.crm8.dynamics.com"; // parent.Xrm.Page.context.getClientUrl() 
 $scope.customerDetails = [];
$scope.retriveData = function(mobileNo) {
 
    var fetchXML = "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false'>" +
                  "<entity name='account'>" +
                    "<attribute name='name' />" +
                   "<attribute name='accountid' />" +
                    "<order attribute='name' descending='false' />" +
                    "<link-entity name='contact' from='contactid' to='primarycontactid' alias='pc'>" +
                      "<attribute name='fullname' alias = 'pc_fullname'/>" +
                         "<filter type='and'>" +
                        "<condition attribute='mobilephone' operator='eq' value='" + mobileNo + "' />" +
                      "</filter>" +
                    "</link-entity>" +
                  "</entity>" +
                "</fetch>"
        $scope.customerDetails = [];
        $http({
            url : serverUrl + "/api/data/v8.0/accounts?fetchXml=" + fetchXML + "",
            method:"GET",
            headers:{
                "OData-MaxVersion": "4.0",
                "OData-Version": "4.0",
                "Accept": "application/json",
                "Prefer": "odata.include-annotations=\"OData.Community.Display.V1.FormattedValue\""
            }
        }).then(function successCb(response){
            var data = response.data;
            console.log(data);
            angular.forEach(data.value, function(value, key) {
                var accounturl = serverUrl + "/main.aspx?etc=1&extraqs=&histKey=422700437&id=%7b" 
                            + value.accountid + "%7d&newWindow=true&pagetype=entityrecord";

                var cusObj = { accountid: value.accountid, 
                               accountnumber: value.name, 
                               fullname: value.pc_fullname, 
                               url: accounturl };
                               console.log(cusObj);
                $scope.customerDetails.push(cusObj);

            });
        }, function errorCb(error){
            console.log("Error cb....", error);
        });

}
 }]);