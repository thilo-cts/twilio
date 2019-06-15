var twilio = require("twilio"),
    _ = require('lodash'),
    async = require('async'),
    request = require('request');


module.exports = function(app) {
    var reservationSid = "",
        ACCOUNT_SID = "ACb4a42bfae704336c8b6a4dcc0da538d8",//"AC7b39bfd4c70d4ec566d865889e03488a",
        AUTH_TOKEN = "6b4f8c172fe6d1d7ec6525bc9667190a", //"d09d8a2f47b8af903e29fecd2337174b",
        WORKSPACE_ID = "WSe467d7434b5eac8434f0ce702c25047c", //""WSf79860f48e7c35cec990789fcb83dd4f",
        WORKFLOW_SID = "WW383d71082cb674adc4e1aa9aa2e0c010", //"WWc6c2d8558e55ce8a91c21db6f1e3a613",
        SIGNINGKEY =  "SKc422e0dbaa1834429d4eb9bcc8813409",//"SK5ea58ce34ab1738fb9b7c65a7a1dd6cf",
        SIGNINGKEY_SECRET = "iMrzzZI1xq9zGtrXhE1wyDbkOHp6z3g1", //"5jVN1gCsuytcovb5TWEFdijyjpgZXI99",
        SERVICE_SID = "IS4af66e850fa941598eb3974b64825eea", //"IS2fb4663fd5214b82ad7c77fa31d992d5",
        CRMURL = 'http://u360service.azurewebsites.net/CRMService.svc'; //'http://sandbox.centralus.cloudapp.azure.com/CRMService/CRMService.svc';

    var wsConnection = {};
    var client = new twilio.TaskRouterClient(ACCOUNT_SID, AUTH_TOKEN, WORKSPACE_ID);

    app.get('/assignment', function(req, res) {
        res.status(200).send({
            "result": "success"
        });
    });

    app.post('/assignment', function(req, res) {
        res.type('application/json');
        console.log("assignment activity", req.body);
        var taskAttributes = isObject(req.body.TaskAttributes) ? req.body.TaskAttributes : JSON.parse(req.body.TaskAttributes);
        reservationSid = req.body.ReservationSid;
        console.log("taskAttributes", taskAttributes, taskAttributes.callBackType === "SMS", taskAttributes.callBackType);

        if (taskAttributes.callBackType === "SMS") {
            console.log("inside sms ...................");
            taskAttributes.assginedWorker = req.body.WorkerSid;
            sendMessage(taskAttributes);
            //   res.send({
            //     "instruction": "accept"
            //   });

        }
        else {
            console.log("call");
            res.send({
                instruction: "call",
                to: "client:" + req.body.WorkerSid, //workerid 
                from: req.body.TaskAttributes.from,
                post_work_activity_sid: 'WA9785faef2753902ac736ba0fb7155bc3',
                url: "http://twilio-client-thilojith.c9users.io/agent_answer",
                status_callback_url: "http://twilio-client-thilojith.c9users.io/agent_answer_status_callback"
            });
        }
    });
   app.post('/sms', function(req, res) {
        var queryType, caseDescription;
        console.log("SMS body", req.body);
         var sms=req.body;
         
        if(sms.Body === 'help'){
            console.log("inside message if help");
            sendSMSToCustomer(sms);
            res.status(200).send({
                successFlag : true
            });
        }else{
            
            queryType= sms.Body.substr(0,sms.Body.indexOf(' ')); 
            caseDescription = sms.Body.substr(sms.Body.indexOf(' ')+1);
           
            if(!setSubType(queryType.toUpperCase()) || caseDescription === ''){
                console.log("wrong format");
                 //sendSMSToCustomer(sms);
                res.status(200).send({
                    error: "Error in the message format"
                })
                return;
            }

             var url = CRMURL + '/CreateInboundSMS';
             var inboundSMSData = {
                PhoneNumber: sms.From,
                Description: caseDescription,
                Type: 1,
                SubType: setSubType(queryType.toUpperCase())
            }
            console.log("inbound data...", inboundSMSData);
            //****Comment this if CRM is working ****
            // var taskDetail = {
            //     subType: inboundSMSData.SubType,
            //     messageBody: inboundSMSData.Description,
            //     phoneNumber: inboundSMSData.PhoneNumber,
            //     caseUrl: 'https://google.com',
            //     caseId: '121'
            // }
            // createTask(taskDetail);
            // res.status(200).send({
            //     "successFlag": true
            // })
            // //****Comment the above block if CRM is working ****

            request.post(url, {json: {request: inboundSMSData }}, function(error, response, body) {
                console.log("eror........", error);
                console.log("body..........", body);
                var crmSMSResponse = _.isString(body) ? {} : body.CreateInboundSMSResult;
                console.log("crmSMSResponse",crmSMSResponse);
                
                if (crmSMSResponse.Error === null && crmSMSResponse.ResponseCode === 101) {
                    var taskDetail = {
                        subType: inboundSMSData.SubType.toString(),
                        messageBody: inboundSMSData.Description,
                        phoneNumber: inboundSMSData.PhoneNumber,
                    caseUrl: crmSMSResponse.CaseURL,
                    caseId: crmSMSResponse.CaseId
                }
                    createTask(taskDetail);
                    res.status(200).send({
                        "successFlag": true
                    });
                }
                else if (crmSMSResponse.Error === null) {
                    res.status(200).send({
                        "successFlag": true
                    });
                }
                else {
                    console.log("crmSMSResponse...", crmSMSResponse);
                    res.status(200).send({
                        error: "Error in creating case in CRM"
                    })
                }

            });

    }
    });


    app.post('/smsWorkerAssignment', function(req, res) {
        console.log("smsWorkerAssignment req body", req.body);
        var ticketDetails = req.body;
        var validationError = smsDetailValidation(ticketDetails);
        console.log(".....validationError..", validationError);
        if (validationError) {
            res.status(200).send({
                error: validationError,
                successFlag: false
            });
        }
        else {
            createTask(ticketDetails);
            res.status(200).send({
                successFlag: true
            })
        }
    });
    
    /**
     * @params
     * subType: 100000000 or 100000001 
     * accountNumber 
     * accountHolderName
     * caseId
     * emailActivitySID
     * {
          "subType": "100000000",
          "accountNumber": "0213123123123",
          "accountHolderName": "Adam",
          "caseId": "243Afsdfds343433",
          "emailActivitySID": "assdfw34234234fh2132124"
        }
     * */
    app.post('/emailWorkerAssignment', function(req, res) {
        console.log("Email WorkerAssignment req body", req.body);
        var ticketDetails = req.body;
        var validationError = emailDetailValidation(ticketDetails);
        console.log(".....validationError..", validationError);
        if (validationError) {
            res.status(200).send({
                error: validationError,
                successFlag: false
            });
        }
        else {
            createEmailTask(ticketDetails);
            res.status(200).send({
                successFlag: true
            })
        }
    });
    
    
    function createEmailTask(taskDetail) {
        var attributes = '{"selected_queue":"' + findSubType(taskDetail.subType) + '",' +
            '"callBackType" : "EMAIL",' +
            '"accountNumber" : "' + taskDetail.accountNumber + '",' +
            '"accountHolderName" : "' + taskDetail.accountHolderName + '",' +
            '"caseId" : "' + taskDetail.caseId + '",' +
            '"emailActivitySID" : "' + taskDetail.emailActivitySID + '"}';

        console.log("attributes..", attributes);
        client.workspace.tasks.create({
            workflowSid: WORKFLOW_SID,
            attributes: attributes
        });
    }

    function createTask(taskDetail) {
        var attributes = '{"selected_queue":"' + findSubType(taskDetail.subType) + '",' +
            '"callBackType" : "SMS",' +
            '"subject" : "' + taskDetail.messageBody + '",' +
            '"from" : "' + taskDetail.phoneNumber + '",' +
            '"caseId" : "' + taskDetail.caseId + '",' +
            '"caseUrl" : "' + taskDetail.caseUrl + '"}';

        console.log("attributes..", attributes);
        client.workspace.tasks.create({
            workflowSid: WORKFLOW_SID,
            attributes: attributes
        });
    }
    function setSubType(field) {
        if (field === 'BL') {
            return "100000000";
        }
        else if (field === 'PY') {
            return "100000001";
        }
        return null;
    }

    function findSubType(subType) {
        if (subType === "100000000") {
            return 'BL';
        }
        else if (subType === "100000001") {
            return 'PY';
        }
    }

    app.post('/agent_answer_status_callback', function(req, res) {
        console.log("req....", req.body);
        res.status(200).send({
            successFlag: false
        });
    });

    function smsDetailValidation(crmObject) {
        if (crmObject && !crmObject.phoneNumber) {
            return "PhoneNumber is required";
        }
        if (crmObject && !crmObject.messageBody) {
            return "Message Body is required";
        }
        if (crmObject && !crmObject.caseUrl) {
            return "Case Url is required";
        }
        if (crmObject && !crmObject.type) {
            return "Case Type is required";
        }
        if (crmObject && !crmObject.subType) {
            return "Case sub Type is required";
        }
        if (crmObject && !crmObject.caseId) {
            return "Case Id is required";
        }
        return null;
    }
    
    function emailDetailValidation(crmObject) {
        if (crmObject && !crmObject.subType) {
            return "Case sub Type is required";
        }
        if (crmObject && !crmObject.caseId) {
            return "Case Id is required";
        }
        if (crmObject && !crmObject.accountHolderName) {
            return "Account holder name is required";
        }
        if (crmObject && !crmObject.accountNumber) {
            return "Account Number is required";
        }
        if (crmObject && !crmObject.emailActivitySID) {
            return "Email activity sid is required";
        }
        return null;
    }


           
            
    function sendSMSToCustomer(sms){
        console.log("inside method sms",sms.From);
        var USER = twilio(ACCOUNT_SID, AUTH_TOKEN); 
        
        USER.messages.create({ 
         from:sms.To,
         to: sms.From, 
         body: "Type BL <space> description for Billing or PY <space> description for Payment", 
         }, function(err, msg) { 
                console.log("sms sent",msg,"err............", err); 
       });
    };
    
    app.post('/agent_answer', function(req, res) {
        console.log("@ agent answer machine", req);
        var twimlResponse = new twilio.TwimlResponse();
        twimlResponse.say("You are now connecting with a customer")
            .dial({
                record: true,

            }, function(node) {
                node.queue({
                    reservationSid: req.query.reservationid
                })
            })
        res.type('text/xml');
        console.log("twimlResponse.toString()", twimlResponse.toString());
        res.send(twimlResponse.toString());
    })


    app.post('/incoming', function(req, res) {
        var twimlResponse = new twilio.TwimlResponse();
        twimlResponse.gather({
            numDigits: 1,
            action: '/call/enqueue',
            method: 'POST'
        }, function(gatherNode) {
            console.log("incomign call voice output");
            gatherNode.say('For Billing, press one. For Payments, press any other key.');
        });
        res.type('text/xml');
        console.log("twimlResponse.toString()", twimlResponse.toString());
        res.send(twimlResponse.toString());
    });

    app.post('/call/enqueue', function(req, res) {
        console.log("req.body", req.body)
        var pressedKey = req.body.Digits;
        var twimlResponse = new twilio.TwimlResponse();
        var selectedLanguage = (pressedKey === '1') ? 'BL' : 'PY';
        console.log("@@@@ Enqueue @@@@@");
        twimlResponse.enqueue({
            workflowSid: WORKFLOW_SID //app.get('workspaceInfo').workflowSid
        }, function(enqueueNode) {
            enqueueNode.task('{"selected_queue": "' + selectedLanguage + '"}');
        });

        res.type('text/xml');
        res.send(twimlResponse.toString());
    });


    app.post('/getToken', function(req, res) {
        console.log("req.body.workerName..", req.body.workerName);
        var client = new twilio.TaskRouterClient(ACCOUNT_SID, AUTH_TOKEN, WORKSPACE_ID);
        var endpointId = req.body.endpointId || '';
        client.workspace.workers.list(function(err, data) {
            if (err) {
                res.status(500).json({
                    errormessage: err
                });
            }
            var worker = _.find(data.workers, {
                friendly_name: req.body.workerName
            });
            if (!worker) {
                res.status(500).json({
                    errormessage: "This Worker might not register into Twilio"
                });
            }
            else {
                var capability = new twilio.Capability(ACCOUNT_SID, AUTH_TOKEN);
                capability.allowClientIncoming(worker.sid); //
                var token = capability.generate(24 * 60 * 60);
                console.log("capability ..............generated.");

                capability = new twilio.TaskRouterWorkerCapability(ACCOUNT_SID, AUTH_TOKEN, WORKSPACE_ID, worker.sid);
                capability.allowActivityUpdates();
                capability.allowReservationUpdates();
                worker.token = capability.generate(24 * 60 * 60);
                // console.log("capability .worker..............",  worker.token);
                var clientChannelToken = getChatToken(worker.friendly_name, endpointId);
                
                res.status(200).json({
                    token: token,
                    worker: worker,
                    clientChannelToken : clientChannelToken
                });
            }
        });

    });

    app.post('/getCustomerToken', function(req, res) {
        var person = req.body;
        console.log("......getCustomerToken...", req.body);
        var customerToken = getChatToken(person.identity, person.endpointId);
        createChatTask(person.identity,person.accountno,person.queueCriteria);
        res.send({"token": customerToken});
    });
    
    function createChatTask(customerIdentity,customerAccountNumber,selectedFields){
        console.log("......selected...", selectedFields);
        
        var attributes = '{ "selected_queue": "'+ selectedFields+ '",' +
            '"callBackType" : "CHAT",' +
            '"customerIdentity" : "' + customerIdentity+ '",' +
            '"customerAccountNumber": "'+customerAccountNumber+ '"}';
            
        console.log("attributes..", attributes);
        client.workspace.tasks.create({
            workflowSid: WORKFLOW_SID,
            attributes: attributes
        });
    }
    
    
    function getChatToken(workerSID, endpointId) {
        var token = new twilio.AccessToken(ACCOUNT_SID, SIGNINGKEY, SIGNINGKEY_SECRET, {
            identity: workerSID,
            ttl: 40000
        });

        //var grant = new twilio.AccessToken.IpMessagingGrant();
        var grant = new twilio.AccessToken.IpMessagingGrant({
            pushCredentialSid: 'CRe9c5eff29e744709d7df875f8a797bf0'
        });

        grant.serviceSid = SERVICE_SID;
        grant.endpointId = SERVICE_SID + workerSID + endpointId;
        token.addGrant(grant);
        return token.toJwt();
    }

    function isObject(obj) {
        return typeof obj === 'object'
    }

    function sendMessage(obj) {
        if (!_.isEmpty(wsConnection)) {
            console.log("..................sending messge.........", obj)
            wsConnection.sendUTF(JSON.stringify(obj));
        }
    }

    //Commenting the below as we no longer required web-socket 
    // wsServer.on('request', function(request) {
    //     console.log((new Date()) + ' Connection from origin ' + request.origin + '.');
    //     var connection = wsConnection = request.accept(null, request.origin);
    //     connection.on('message', function(message) {
    //         console.log("message..............", message);
    //         connection.sendUTF(JSON.stringify({
    //             type: 'color',
    //             data: "hellowooow"
    //         }));
    //         if (message.type === 'utf8') {
    //             // process WebSocket message
    //         }
    //     });

    //     connection.on('close', function(connection) {
    //         console.log("connection.....clos.........", connection);
    //         // close user connection
    //     });
    // });

}
