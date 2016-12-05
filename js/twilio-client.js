angular.module('agent', ['ngMaterial', 'ngRoute'])
 .controller('agentLoginController', ['$scope', '$http','$interval','$timeout','$mdToast',function ($scope, $http,$interval,$timeout,$mdToast) {
  chrome.app.window.current().setAlwaysOnTop(true);
  $scope.welcomeMsg = "Agent Login";
  $scope.notLogin = true;
  $scope.errorMessage = '';
  $scope.log = '';
  $scope.loggedIn =true;
  $scope.inCall =true;
  $scope.inSms = true;
  $scope.issmsaccepted=false;
  $scope.incomingPhoneNumber = '';
  $scope.initiateTwilio = function () {
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
    }, function errorCallback(response) {
      console.log(response);
      $scope.errorMessage = response.data.errormessage;
    })
  }

  function setUpToken(token) {
    Twilio.Device.setup(token, {
      'debug': true
    });
  }
  Twilio.Device.ready(function (device) {
    $("#log").text("Ready");
  });

  Twilio.Device.error(function (error) {
    $("#log").text("Error: " + error.message);
  });

  Twilio.Device.connect(function (conn) {
    $("#log").text("Successfully established call");
  });
  var callConnection = '';

  Twilio.Device.incoming(function (connection) {
    console.log("incoming..............", connection);
    $scope.incomingPhoneNumber = connection.parameters.From;
    $scope.inCall = true;
   
    callConnection = connection;
    $scope.$apply();
  });

  $scope.accept = function () { 
    console.log("accept..............");
    $scope.isCallAccepted = true;
    $scope.startTimer();
    callConnection.accept();
  }

  $scope.reject = function () {
    console.log("reject..............");
    callConnection.reject();
  }
  $scope.respond=function(){
    $scope.issmsaccepted=true;
  }

  var customerDetails_HC = {
    "@odata.context": "https://utilities360.crm8.dynamics.com/api/data/v8.0/$metadata#accounts(name,accountid)", "value": [
      {
        "@odata.etag": "W/\"861070\"", "name": "4323657869", "accountid": "3B816E1C-BDAB-E611-8111-C4346BDC3CC1", "pc_fullname": "Chris Brown", "options": {
          "icon": 'communication:phone',
          "avatarIcon": true
        },"address":"19 Barton Court, Warrington, WA25TE"
      }, {
        "@odata.etag": "W/\"861069\"", "name": "4323657857", "accountid": "3B816E1C-BDAB-E611-8111-C4346BDC3CC1", "pc_fullname": "Adam Addis", "options": { "icon": 'communication:phone',
          "avatarIcon": true
        },"address":"54 Honeywell Drive, Liverpool, LA2TAJ"

      }, {
        "@odata.etag": "W/\"861115\"", "name": "4323657890", "accountid": "3B816E1C-BDAB-E611-8111-C4346BDC3CC1", "pc_fullname": "Sara Maltby", "options": { "icon": 'communication:phone',  "avatarIcon": true
        },"address":"29 London Street, Manchester, MA2REL"
      }
    ]
  };
  $scope.customerDetails = [];
  var serverUrl = "https://utilities360.crm8.dynamics.com";
  var serverUrlPath = "/nga/engagementhub.aspx?org=org7d548c73&pagetype=interactioncentricform&etn=account&id=";
  angular.forEach(customerDetails_HC.value, function (value, key) {
    var accounturl = serverUrl + serverUrlPath + value.accountid;

    var cusObj = {
      accountid: value.accountid,
      accountnumber: value.name,
      fullname: value.pc_fullname,
    
      address:value.address,
      url: accounturl
    };
    console.log(cusObj);
    $scope.customerDetails.push(cusObj);

  });
  if (customerDetails_HC.value.length === 1) {
    var cusObj = customerDetails_HC.value[0];
    var accounturl = serverUrl + serverUrlPath + cusObj.accountid;
    $scope.redirect(accounturl);
  }


  $scope.retriveData = function (mobileNo) {

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
      url: serverUrl + "/api/data/v8.0/accounts?fetchXml=" + fetchXML + "",
      method: "GET",
      headers: {
        "OData-MaxVersion": "4.0",
        "OData-Version": "4.0",
        "Accept": "application/json",
        "Prefer": "odata.include-annotations=\"OData.Community.Display.V1.FormattedValue\""
      }
    }).then(function successCb(response) {
      var data = customerDetails_HC;
      console.log(data);
      angular.forEach(data.value, function (value, key) {
        var accounturl = serverUrl + "/main.aspx?etc=1&extraqs=&histKey=422700437&id=%7b"
          + value.accountid + "%7d&newWindow=true&pagetype=entityrecord";

        var cusObj = {
          accountid: value.accountid,
          accountnumber: value.name,
          fullname: value.pc_fullname,
          url: accounturl
        };
        console.log(cusObj);
        $scope.customerDetails.push(cusObj);

      });
    }, function errorCb(error) {
      console.log("Error cb....", error);
    });

  }

  $scope.redirect = function (url) {
    chrome.runtime.sendMessage(
      'ieeinffblmmcpnhfebhimfakbcfkjcap',
      { myCustomMessage: url },
      function (response) {
        console.log("response: " + JSON.stringify(response));
      });
  }
   $scope.seconds=0;
  $scope.minutes=0;
  $scope.hours=0;
  $scope.startTimer = function (){
     timerID=$interval(function(){
      timer();
    },1000);
            };

            function timer(){
              ++$scope.seconds;
              if ($scope.seconds==60){
                $scope.seconds=0;
                ++$scope.minutes;
                if($scope.minutes==60){
                  $scope.minutes=0;
                  ++$scope.hours;
                }
              }
            }

            $scope.stopTimer = function (){
               $interval.cancel(timerID);

              $timeout(cleartimer, 2000);
            };
             var cleartimer=function(){
              $scope.seconds=0;
              $scope.minutes=0;
              $scope.hours=0;
              $scope.isCallAccepted = false;
}


  $scope.openToast = function($event) {
    $mdToast.show($mdToast.simple().textContent('Hello!'));
    // Could also do $mdToast.showSimple('Hello');
  };

}]);

