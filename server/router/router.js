var twilio = require("twilio"),
  _ = require('lodash');
module.exports = function(app) {
    var reservationSid = "",
     ACCOUNT_SID= "ACb9ddf1dbbfa41e1895a9caa5772c60eb",
     AUTH_TOKEN = "947a65c914f9e436032207e9b44bffd6",
     WORKSPACE_ID = "WSc99127dbd5f96d4dfedaf39b7a16353a",
     WORKFLOW_SID = "WW0b65c0b1a905082e4999f2a8611ae1af";
    
    app.get('/assignment', function(req, res) {
        res.status(200).send({
            "result": "success"
        });
    });

    app.post('/assignment', function(req, res) {
        res.type('application/json');
        console.log("assignment activity", req.body);
        reservationSid = req.body.ReservationSid;
        res.send({
            instruction: "call",
            to: "client:"+ req.body.WorkerSid, //workerid 
            from: req.body.TaskAttributes.from,
            post_work_activity_sid: 'WAf4a0bf42a3894bb6c5cc323e3040fc0c',
            url: "http://twilio-client-thilojith.c9users.io/agent_answer",
            status_callback_url: "http://twilio-client-thilojith.c9users.io/agent_answer_status_callback"
        });
    });


    //   {
    //   "instruction": "call",
    //   "to": "client:jenny",
    //   "from": "+15558675309",
    //   "url": "http://twilio-client-thilojith.c9users.io/agent_answer",   
    //   "status_callback_url":
    //     "http://example.com/agent_answer_status_callback"
    // }
    
     app.get('/agent_answer_status_callback', function(req, res) {
         console.log("req....", req.body);
     });
     
    app.post('/agent_answer', function(req, res) {
        console.log("@ agent answer machine");
        var twimlResponse = new twilio.TwimlResponse();
        twimlResponse.say("You are now connecting with a customer")
            .dial({
                record: true,

            }, function(node) {
                node.queue({
                    reservationSid: reservationSid
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
            gatherNode.say('For English, press one. For Spanish, press any other key.');
        });
        res.type('text/xml');
        console.log("twimlResponse.toString()", twimlResponse.toString());
        res.send(twimlResponse.toString());
    });

    app.post('/call/enqueue', function(req, res) {
        console.log("req.body", req.body)
        var pressedKey = req.body.Digits;
        var twimlResponse = new twilio.TwimlResponse();
        var selectedLanguage = (pressedKey === '1') ? 'en' : 'es';
        console.log("@@@@ Enqueue @@@@@");
        twimlResponse.enqueue({
            workflowSid: WORKFLOW_SID //app.get('workspaceInfo').workflowSid
        }, function(enqueueNode) {
            enqueueNode.task('{"selected_language": "' + selectedLanguage + '"}');
        });

        res.type('text/xml');
        res.send(twimlResponse.toString());
    });
    
    app.post('/getToken', function(req, res) {
        console.log("req.body.workerName..", req.body.workerName);
        var client = new twilio.TaskRouterClient(ACCOUNT_SID, AUTH_TOKEN, WORKSPACE_ID);

        client.workspace.workers.list(function(err, data) {
            if(err){
                res.status(500).json({errormessage : err});
            }
            var worker = _.find(data.workers, {friendly_name : req.body.workerName});
            if(!worker){
                res.status(500).json({errormessage: "This Worker might not register into Twilio"});
            }else{
                var capability = new twilio.Capability(ACCOUNT_SID, AUTH_TOKEN);
                capability.allowClientIncoming(worker.sid); //
                var token = capability.generate(24*60*60);
                console.log("capability ...............", token);
                res.status(200).json({token:token, worker : worker});
            }
        });
        
    });

}