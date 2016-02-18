
var started = false;
var startCount = 0;
var projects =[];
var activities =[];
var cp={};
var sessionGuid = "";
var isStart = true;
var sendImage = true;
var photo;
var internetAvailable=true;
var lastScreenshot;
var local_stream;
var newTaskName;
var userNameText;
var stopReason='NormalStop';
var passwordText;
var screenshotInt = 3; // 3 minutes!
var cpReminderInterval = 2; // 2 mins of inactivity!
var logNumber;
var notid=0;
var retryNum = 0;
var imageFailCount = 0;
var progressiveDelay = 1000;
var versionString = '1.14';
var lastLog = null;
var idleNotificationPending = false;
var db;

var RootUrl = "http://localhost:3000";
var RootApiUrl = "http://localhost:3000/api";


function toggle()
{

    var log = document.getElementById('log');
    var toggleButton = document.getElementById('toggleButton');
    isStart = true;
    if (started)
    {
        stopReason = "NormalStop";
	   stopTimer();
    }
    else
    {
		retryNum=0;

	 if($('#activityList').val()<0)
	{
		$("#myModal").modal();
		$('#newTaskTitle').val('');
	}
	else
	{
        chrome.desktopCapture.chooseDesktopMedia(["screen"], onAccessApproved);
	}
    }

}


function checkStoredCredentials()
{
  chrome.storage.local.get(null,
    function (items)
    {userNameText=items['storedUserName']; passwordText=items['storedPassword']; tryLogin();});

}

function tryLogin()
{
  if(userNameText)
  {
    if(passwordText)
    {

      $('#username').val(userNameText);
      $('#password').val(passwordText);
      $('#loginButton').click();
    }
  }

}

function setStoredCredentials()
{
  chrome.storage.local.set({'storedUserName':userNameText,'storedPassword':passwordText});

}



function minimizeApplication()
{

    chrome.app.window.current().minimize();
}

function stopTimer()
{
	   if (local_stream)
	   {
	       if ( local_stream.stop != undefined )
               {
	       console.log( 'localstream' + JSON.stringify( local_stream ) );
	       local_stream.stop();
	       }
	   }
	$('#projectList').removeAttr('disabled');
		$('#activityList').removeAttr('disabled');
        $('#statuslabel').html('Stopped');
		$('#toggleButton').removeClass('btn-danger');
		$('#toggleButton').addClass('btn-success');
		$('#statusdiv').removeClass('started');
          $("#markCompleteLink").show();
        started = false;
        toggleButton.value = "Start";
}

chrome.idle.onStateChanged.addListener(function(newState) {
  if(newState === "idle") {

    if(started)
    {
      stopReason="Idle";
      stopTimer();
      idleNotificationPending=true;
    showInfoNotification("Timer has stopped because you have not interacted with the computer for "+cp.reminderInterval+ " minutes. You can ask your account administrator to change this setting or timeout duration.");

  }
  }
  else if(newState==="active")
  {
    if(idleNotificationPending==true)
    {
      showInfoNotification("Timer was automatically stopped because you did not interact with the computer for "+cp.reminderInterval+ " minutes. You can ask your account administrator to change this setting or timeout duration.");
      idleNotificationPending=false;
    }
  }
});

function startTimer()
{
	started = true;
	logNumber = 0;

      $("#markCompleteLink").hide();
		$('#statusdiv').addClass('started');
		$('#toggleButton').addClass('btn-danger');
		$('#toggleButton').removeClass('btn-success');
		$('#statuslabel').html('Working');
		toggleButton.value = "Stop";
		startCount++;
		$('#projectList').attr('disabled',true);
		$('#activityList').attr('disabled',true);
        setTimeout(logLoop, 500,startCount);
        progressiveDelay = 1000;

}

function onAccessApproved(desktop_id) {
    if (!desktop_id) {
        stopReason = 'AccessNotGranted';
         stopTimer();

        return;
    }
    desktop_sharing = true;

    console.log("Desktop sharing started.. desktop_id:" + desktop_id);

    navigator.webkitGetUserMedia({
        audio: false,
        video: {
            mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: desktop_id,
                minWidth: 1280,
                maxWidth: 1280,
                minHeight: 720,
                maxHeight: 720,

   minFrameRate: 1,
   maxFrameRate: 1

            }
        }
    }, gotStream, getUserMediaError);

    function gotStream(stream) {

        local_stream = stream;
        document.querySelector('video').src = URL.createObjectURL(stream);
        startTimer();
        stream.onended = function () {
            if(stopReason=='NormalStop')
            {
            stopReason = "CaptureStopped";
            }
            stopTimer();
        };
    }

    function getUserMediaError(e) {
        stopReason = 'CouldNotCaptureScreen';
      stopTimer();
	  logOut('Could not capture screen');
    }
}

function loadActivities()
{

	$('#activityList').children().remove();
	//var selectedKey = $('#projectList').val();
	$('#activityList')
    .find('option')
    .remove();
    console.log("!!!", cp);
    for (i in cp.tasks) {
        var task = cp.tasks[i];
        console.log("task:", task);
        $('<option value="'+task.id+'">'+task.title+'</option>').appendTo($('#activityList'));
    }
	$('#activityList').removeAttr('disabled');
	checkActivitySelected();
}

function retryStart(failMsg)
{
    checkNetConnection();
	if(retryNum<20)
			{
				retryNum=retryNum+1;
				console.log("Attempt "+retryNum+" Connection Error");
				setTimeout(startTimer, 8000);

			}
			else
			{


			    stopReason = 'Attempt ' + retryNum + ' Connection Error';

                if(internetAvailable)
                {
                    stopReason = 'Service Unavailable';
                    console.log('Navigator is online');
                }
			stopTimer();
			logOut(failMsg);
			}
}



function checkNetConnection(){


 r=Math.round(Math.random() * 10000);
 $.get(RootUrl + "/img/icon_128.png",{subins:r}).success(function(){
     console.log('Fetched Image');
  internetAvailable=true;
 }).error(function(){
     console.log('Could not fetch image');
      var opt = {
        type: "basic",
        title: "Trying to reconnect. Attempt "+retryNum+" of 20",
        message: 'Your session will continue if CodingNinjas is able to re-connect to the Internet before exhausting all retry attempts.',
        contextMessage: 'Please check your Internet connection.',
        iconUrl: "icon.png"
      }
	  notid++;
		 chrome.notifications.create(' '+notid, opt, function() {});
  internetAvailable=false;
 });

}


function logLoop(retCount)
{

   console.log("log loop called for retCount " + retCount);
    var log = document.getElementById('log');
	var isScr = (logNumber%screenshotInt==0);
	logNumber = (logNumber+1)%screenshotInt;
    var activity = document.getElementById('activityList');
	console.log(' '+ activity.value + ' '+ sessionGuid + 'isStart: '+isStart + 'isScr: '+isScr);
    if(started&&retCount==startCount)
    {
		console.log("Sending log");
		$.post(RootApiUrl + "/LogData", {
		    guid: sessionGuid,
		    taskId: activity.value,
		    isScreenshot: isScr,
		    forceWorkingStatus: false,
		    isStartLog: isStart,
		    inactivityAlert: false,
		    keyCount: 0,
		    mouseCount: 0,
		    windowTitle: 'chromeClient',
		    image: 'img',
		    auxData: 'chromeClient'
		})
.done(processRequest(retCount)).fail(function (data) {


    if (typeof data.responseText == "undefined") {

        retryStart('Connection Error. Please check your internet connection and sign in again.');
    }
    else {
        stopTimer();
        var resp = jQuery.parseJSON(data.responseText);
        logOut(resp.Message);
        stopReason = resp.Message;
    }


});


    }
	else if(retCount!=startCount)
	{
		console.log(' retcount not matched' )  ;
	}
}


function processRepeat(retCount)
{


	 console.log("process repeat called");
        if(isStart)
		{
			isStart=false;
		}


			console.log("Normal Start" + retCount + " "+startCount);
			console.log("process repeat scheduling logloop for retcount "+ retCount);
            setTimeout(logLoop, progressiveDelay,retCount);
            if(progressiveDelay>60000)
            {
                progressiveDelay = 60000;
            }
            else
            {
                progressiveDelay = progressiveDelay + 10000;
            }



}



function processRequest(retCount)
{
    return function (data) {

        lastLog = new Date();
        console.log("success handler called");
        sessionGuid = data.sessionGuid;
        retryNum = 0;
        var video = document.querySelector('video');

        var context = photo.getContext('2d');
        var lastContext = lastScreenshot.getContext('2d');
        photo.width = video.clientWidth;
        photo.height = video.clientHeight;
        context.drawImage(video, 0, 0, photo.width, photo.height);
        lastContext.drawImage(video, 0, 0, 300, 192);
        console.log("success handler checking image urls");
        if (data.signedUrl != null && data.signedUrlthumb != null) {
            console.log("success handler found image urls");
            var dat = photo.toDataURL("image/jpeg");
            var dat1b = dataURItoBlob(dat);

            console.log("Sending Main Image");
            $.ajax({
                processData: false,
                url: data.signedUrl,
                timeout: 240000,
                contentType: "binary/octet-stream",
                type: "PUT",
                data: dat1b,

                success: function (json) {
                    imageFailCount = 0;

                },
                error: function (json) {
                    console.log(json);
                    imageFailCount++;
                    console.log("Image Fail Count " + imageFailCount);

                }
            });

            var dat2 = lastScreenshot.toDataURL("image/jpeg");
            var dat2b = dataURItoBlob(dat2);


            console.log("Sending thumb");
            $.ajax({

                processData: false,
                url: data.signedUrlthumb,
                timeout: 240000,
                contentType: "binary/octet-stream",
                type: "PUT",
                data: dat2b,

                success: function (json) {
                    imageFailCount = 0;


                },
                error: function (json) {
                    console.log(json);

                    imageFailCount++;
                    checkNetConnection();
                    console.log("Image Fail Count " + imageFailCount);



                }
            });
        }
        if (imageFailCount > 12) {
            imageFailCount = 0;
            stopReason = 'Connection Error Image' + imageFailCount;

            if (internetAvailable) {
                stopReason = 'ErrorSendingImages';
                console.log('StopReason: Error Sending Images');
            }
            stopTimer();
            logOut("There was an error sending images to server. Please contact CodingNinjas support.");
        }
        else {
            console.log("success handler calling process repeat");
            processRepeat(retCount);
        }

        /*
        $.ajax({

        type: "PUT",
        url: data.signedUrlthumb,
        data: lastScreenshot.toDataURL("image/jpeg"),
        success: function(json){

        },
        error: function(json){
        console.log(json);
        stopTimer();
        }
        });

        */



    }
}

function dataURItoBlob(dataURI) {
    var byteString = atob(dataURI.split(',')[1]);
    var ab = new ArrayBuffer(byteString.length);
    var ia = new Uint8Array(ab);
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
	return ia;
   // return new Blob([ab], { type: 'binary/octet-stream' });
}

function checkNewActivity()
{
    checkActivitySelected();
	if($('#activityList').val()<0)
	{

		$("#myModal").modal();
		$('#newTaskTitle').val('');
	}
}

function logOut(message)
{
	$('#loginDiv').show();
		$('#mainDiv').hide();
		$('#myModal').modal('hide');
		$('#messageLabel').html(message);
		$('#username').prop('disabled', false)
		$('#password').prop('disabled', false)
		 var opt = {
        type: "basic",
        title: "CodingNinjas has stopped",
        message: message,
        iconUrl: "icon.png",
        priority: 2
      }
	  notid++;
		 chrome.notifications.create(' '+notid, opt, function() {});
}

function showNotification(message)
{
    	 var opt = {
        type: "basic",
        title: "CodingNinjas has stopped",
        message: message,
        iconUrl: "icon.png",
        priority: 2
      }
	  notid++;
		 chrome.notifications.create(' '+notid, opt, function() {});
}

function showInfoNotification(message)
{
    	 var opt = {
        type: "basic",
        title: "Important Alert",
        message: message,
        iconUrl: "icon.png",
        priority: 2
      }
	  notid++;
		 chrome.notifications.create(' '+notid, opt, function() {});
}

function prepareMain(data)
{
	var i,j;



	photo = document.getElementById('screenshot');
	//screenshotInt = 3; //data.screenshotInterval; 
    lastScreenshot = document.getElementById('last-screenshot');
	cp = data;
    chrome.idle.setDetectionInterval(cpReminderInterval*60);
    console.log("showing initial notification");
  //showInfoNotification("Timer is set to automatically stop after "+cp.reminderInterval+" minutes of inactivity. You can ask your account administrator to change this setting or timeout duration.");
	sessionGuid = cp.guid;
		$('#mainDiv').show();
		$('#loginDiv').hide();
		loadActivities();
}




$(function () {

    $('#minimizeLink').click(function () { minimizeApplication(); });

    $('#loginButton').click(function (e) {
        e.preventDefault();
        $('#messageLabel').html(' ');
        userNameText = $('#username').val();
        $('#username').prop("disabled", true);
        passwordText = $('#password').val();
        $('#password').val('');
        var l = Ladda.create(this);
        l.start();


        $.post(RootApiUrl + "/Login", { UserName: userNameText, Password: passwordText, ActiveProjectId: -1, LoginAuxData: 'ver:' + versionString + ':' + stopReason })
.done(function (data) {
    console.log("!!!!!", data);
    prepareMain(data);
    setStoredCredentials();
    $('#loggedInAs').html(' '+userNameText);
    checkActivitySelected();
}).fail(
function (data) {
    if (typeof data.responseText == "undefined") {
        logOut("Connection Error. Please check your internet connection and sign in again.");
    }
    else {
        var resp = jQuery.parseJSON(data.responseText)
        logOut(resp.Message);
    }
}
  ).always(function () { l.stop(); });

        return false;


    });
    $("#newTaskTitle").keyup(function (e) {
        var str = $.trim($(this).val());
        if (str != "") {
            var regx = /^[a-zA-Z0-9\-\s]+$/;
            if (!regx.test(str) || str.length > 50) {
                $("#taskMessageLabel").html("Only 1 to 50 Alphanumeric Characters Allowed");
                $('#newTaskButton').hide();
                return;
            }
        }
        else {
            $("#taskMessageLabel").html("Task name cannot be empty");
            $('#newTaskButton').hide();
            return;
        }
        $("#taskMessageLabel").html(" ");
        $('#newTaskButton').show();
    });
    $('#newTaskButton').hide();
    $('#newTaskButton').click(function (e) {

        e.preventDefault();
        $("#taskMessageLabel").hide();
        var l = Ladda.create(this);
        l.start();
        var taskT = $('#newTaskTitle').val();
        newTaskName = taskT;
        var prId = $('#projectList').val();
        $.post(RootApiUrl + "/CreateTask", { UserName: userNameText, Password: passwordText, ActiveProjectId: -1, TaskTitle: taskT, ProjectId: prId })
.done(function (data) {

}).fail(function (data) {
    logOut('Failed to create task.');
}).always(function () { /*l.stop();*/ });



        $.post(RootApiUrl + "/Login", { UserName: userNameText, Password: passwordText, ActiveProjectId: prId, LoginAuxData: 'ver:' + versionString + ':CreateTask' + stopReason })
.done(function (data) {
    prepareMain(data);
    checkActivitySelected();
}).fail(function (data) {
    logOut('Connection Error. Please check your internet connection and sign in again.');


}).always(function () { l.stop(); $('#myModal').modal('hide'); });

        return false;


    });

    $('#signOutLink').click(function(e){
      stopReason = 'logout';
      stopTimer();
      userNameText='';
      passwordText='';
      setStoredCredentials();
      logOut('You have successfully signed out.');
    });

    $('#markCompleteLink').click(function (e) {

        e.preventDefault();
        $("#markCompleteText").html('Please wait..');
        $("#toggleButton").hide();

        var prId = $('#projectList').val();
        var tskId = $('#activityList').val();
        $.post(RootApiUrl + "/MarkTaskCompleted", { UserName: userNameText, Password: passwordText, ActiveProjectId: -1, TaskId: tskId, ProjectId: prId })
.done(function (data) {

}).fail(function (data) {
    showNotification('Task could not be marked complete. Either the task was not explicitly assigned to you or this task is marked as an ongoing task.');
}).always(function () { /*l.stop();*/ });



        $.post(RootApiUrl + "/Login", { UserName: userNameText, Password: passwordText, ActiveProjectId: prId, LoginAuxData: 'ver:' + versionString + ':CreateTask' + stopReason })
.done(function (data) {
    prepareMain(data);
}).fail(function (data) {
    logOut('Connection Error. Please check your internet connection and sign in again.');


}).always(function () {
    $("#markCompleteText").html('Mark Complete');
    $("#toggleButton").show();
    checkActivitySelected();
});

        return false;


    });

    checkStoredCredentials();

});

function checkActivitySelected()
{
    if($('#activityList').val()==(-1))
    {
        toggleButton.value = "Add Task";
        $("#markCompleteLink").hide();
    }
    else
    {
        toggleButton.value = "Start";
          $("#markCompleteLink").show();
    }
}


document.addEventListener('DOMContentLoaded', function () {
  //$('#projectList').on('change',loadActivities);
  $('#activityList').on('change',checkNewActivity);
  $('#toggleButton').on('click',toggle);
 // $('#loginButton').on('click',login);

});
