var Unsubscriber = {

	setUp : function() {
		window.addEventListener("pagehide", Unsubscriber.onPageUnload, false);
	},

	onPageUnload : function(e) {
		bBox = document.getElementById("newsletter_abmeldebox");
		if (bBox) {
			document.getElementById("inxlistunsubscribe_hbox_contentbox")
					.removeChild(bBox);
		}
	},

	scanHeader : function() {
		var msg = gDBView.URIForFirstSelectedMessage;
		if (msg == null) {
			return;
		}
		var messenger = Components.classes["@mozilla.org/messenger;1"]
				.createInstance(Components.interfaces.nsIMessenger);
		var msgService = messenger.messageServiceFromURI(msg);
		msgService.CopyMessage(msg, Unsubscriber.StreamListener, false, null,
				msgWindow, {});
	},

	checkForDisplay : function() {
		var url = Unsubscriber.headers.extractHeader("list-unsubscribe", false);
		var button = document.getElementById("inxlistunsubscribeButton");
		if (url) {
			button.setAttribute("disabled", "false");
		} else {
			button.setAttribute("disabled", "true");
		}
	},

	unsubscribe : function() {
		var strings = document.getElementById("inxlistunsubscribe-strings");

		var promptService = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
				.getService(Components.interfaces.nsIPromptService);
		var url = Unsubscriber.headers.extractHeader("list-unsubscribe", false);
		if (url.indexOf("http") != -1){
		
			var result = promptService.confirm(window, strings
					.getString("messageBoxLabel"), strings.getString("messageBoxContentLink"));
			if (result) {
				var uri = Components.classes["@mozilla.org/network/standard-url;1"]
					.createInstance(Components.interfaces.nsIURI);
				var posHttp = url.indexOf("<http");
				url = url.substring(posHttp + 1);
				url = url.substring(0, url.indexOf(">"));	
				uri.spec = url;
				var protocolSvc = Components.classes["@mozilla.org/uriloader/external-protocol-service;1"]
						.getService(Components.interfaces.nsIExternalProtocolService);
				protocolSvc.loadUrl(uri);
			}
		} else 
		{
			if (url.indexOf("mailto") != -1) {
				var result = promptService.confirm(window, strings
					.getString("messageBoxLabel"), strings.getString("messageBoxContent"));
				if (result) {
					var posMailTo = url.indexOf("<mail");
					url = url.substring(posMailTo + 1);
					url = url.substring(0, url.indexOf(">"));
					var msgComposeService = Components.classes["@mozilla.org/messengercompose;1"]
							.getService(Components.interfaces.nsIMsgComposeService);
					var ioService = Components.classes["@mozilla.org/network/io-service;1"]
							.getService(Components.interfaces.nsIIOService);
					aURI = ioService.newURI(url, null, null);
					msgComposeService.OpenComposeWindowWithURI(null, aURI);
				}
			}
			
		}		
	},

	setupEventListener : function() {
		Unsubscriber.setUp();

		var listener = {};
		listener.onStartHeaders = function() {};
		listener.onEndHeaders = Unsubscriber.scanHeader;
		gMessageListeners.push(listener);
	}

}

Unsubscriber.StreamListener = {
	content : "",
	found : false,
	onDataAvailable : function(request, context, inputStream, offset, count) {
		try {
			var sis = Components.classes["@mozilla.org/scriptableinputstream;1"]
					.createInstance(Components.interfaces.nsIScriptableInputStream);
			sis.init(inputStream);

			if (!this.found) {
				this.content += sis.read(count);
				this.content = this.content.replace(/\r/g, "");
				var pos = this.content.indexOf("\n\n");

				if (pos > -1) {
					this.content = this.content.substr(0, pos + 1);
					this.found = true;
				}
			}
		} catch (ex) {
		}
	},
	onStartRequest : function(request, context) {
		this.content = "";
		this.found = false;
	},
	onStopRequest : function(aRequest, aContext, aStatusCode) {
		Unsubscriber.headers = Components.classes["@mozilla.org/messenger/mimeheaders;1"]
				.createInstance(Components.interfaces.nsIMimeHeaders);
		Unsubscriber.headers.initialize(this.content, this.content.length);
		Unsubscriber.headerdata = this.content;
		Unsubscriber.checkForDisplay();
	}
};

addEventListener('messagepane-loaded', Unsubscriber.setupEventListener, true);
