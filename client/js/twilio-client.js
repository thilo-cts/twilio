 angular.module('agent', []).controller('agentLoginController', ['$scope', '$http', function($scope, $http) {
     console.log("workernae", $scope.workerName);
     $scope.welcomeMsg = "Agent Login";
     $scope.notLogin = true;
     $scope.errorMessage = '';
     $scope.log = '';
     $scope.loggedIn = false;
     $scope.inCall = false;
     
     var worker = {};
     
     $scope.initiateTwilio = function() {
         
         console.log("workernae", $scope.workerName);

         $http({
             method: 'POST',
             url: 'https://twilio-client-thilojith.c9users.io/getToken',
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
            // $scope.retriveData('+19733689700');
         }, function errorCallback(response) {
             console.log(response);
             $scope.errorMessage = response.data.errormessage;
         });
     }

     function setUpToken(token) {
        // $scope.log = token;
         Twilio.Device.setup(token, {
             'debug': true
         });
         worker = new Twilio.TaskRouter.Worker(token);
     }
     
     function _find(arr , property, propertyValue){
         var obj = [];
         angular.forEach(arr, function(value, key) {
             if(value[property] === propertyValue){
                 obj = value;
             }
         });
         return obj;
     }
         Twilio.Device.ready(function(device) {
             $("#log").text("Ready");
         });

         Twilio.Device.error(function(error) {
             $("#log").text("Error: " + error.message);
         });

         Twilio.Device.connect(function(conn) {
              $("#log").text("Successfully established call");
         });
     var callConnection = '';
     
     Twilio.Device.incoming(function(connection) {
         console.log("..hey coming ......");
         alert("incoming....");
              console.log("incoming..............");
              $scope.inCall = true;
              callConnection = connection;
              $scope.$apply();
              
     });
     
     $scope.accept =  function(){
      
      callConnection.accept();
     }
     
      $scope.reject =  function(){
        console.log("reject..............");
        callConnection.reject();
     }
     
     
var customerDetails_HC = {
  "@odata.context":"https://utilities360.crm8.dynamics.com/api/data/v8.0/$metadata#accounts(name,accountid)","value":[
    {
      "@odata.etag":"W/\"861070\"","name":"4323657869","accountid":"49816e1c-bdab-e611-8111-c4346bdc3cc1","pc_fullname":"Chris Brown"
    },{
      "@odata.etag":"W/\"861069\"","name":"4323657873","accountid":"4f816e1c-bdab-e611-8111-c4346bdc3cc1","pc_fullname":"Adam Addis"
    },{
      "@odata.etag":"W/\"861115\"","name":"4323657890","accountid":"69816e1c-bdab-e611-8111-c4346bdc3cc1","pc_fullname":"Dan Brown"
    }
  ]
};

 $scope.customerDetails = [];
 var serverUrl= "https://utilities360.crm8.dynamics.com";
 var serverUrlPath = "/nga/engagementhub.aspx?org=org7d548c73&pagetype=interactioncentricform&etn=account&id=";
 angular.forEach(customerDetails_HC.value, function(value, key) {
                var accounturl = serverUrl + serverUrlPath+ value.accountid;

                var cusObj = { accountid: value.accountid, 
                               accountnumber: value.name, 
                               fullname: value.pc_fullname, 
                               url: accounturl };
                               console.log(cusObj);
                $scope.customerDetails.push(cusObj);

            });
            if(customerDetails_HC.value.length ===1){
               var cusObj = customerDetails_HC.value[0];
               var accounturl = serverUrl + "/main.aspx?etc=1&extraqs=&histKey=422700437&id=%7b" 
                            + cusObj.accountid + "%7d&newWindow=true&pagetype=entityrecord";
               window.location.href = accounturl;
            }
            

 // parent.Xrm.Page.context.getClientUrl() 

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
            var data = customerDetails_HC;
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