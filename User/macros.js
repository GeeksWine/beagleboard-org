function prompt_macro (param)
 {
  function updateUserState ()
   {
    if (req.data["logout"])
     {
      app.log("Logging out.");
      session.logout();
     }
    else if (req.data["openid_url"])
     {
      var openID = req.data["openid_url"];
      var returnToURL = req.getServletRequest().getRequestURL();
      var realm = "http://*.beaglecomputer.org";
      app.log("Requesting authorization: openID=" + openID + ", returnToURL=" + returnToURL + 
       ", realm=" + realm);
      authRequest(openID, returnToURL, realm);
     }
    else if (req.data["openid.identity"])
     {
      var queryString = req.getServletRequest().getQueryString();
      var requestURL = req.getServletRequest().getRequestURL();
      app.log("Verifying response: requestURL=" + requestURL + ", queryString=" + queryString);
      var serverResponse = verifyResponse(requestURL, queryString);
      app.log("serverResponse=" + serverResponse);
     }
   }

  /**
   * This function fetches the OpenID4Java ConsumerManager for this session or
   * creates one.
   *
   * @todo Error handling needs some work.
   */
  function getManager ()
   {
    if (!session.data["manager"])
     {
      app.log("Allocating new manager");
      session.data["manager"] = new Packages.org.openid4java.consumer.ConsumerManager();
     }

    return (session.data["manager"]);
   }

  /**
   * This function generates an authentication request for the provided identity for
   * the associated authentication server then forwards the browser to that server to 
   * perform the password verification.
   *
   * session.data["openid-disco"] maintains the information discovered by this request
   * prior to forwarding to the server performing the authentication.
   *
   * @param userSuppliedString The identity string provided by the user.
   * @param returnToURL        The URL where the authentication server should forward the
   *                           browser back to this site.
   * @param realm              The URL pattern for which to request authentication.
   * @see getManager
   */
  function authRequest (userSuppliedString, returnToURL, realm)
   {
    try
     {
      var manager = getManager();
      var warning = "";
      var openid_url = userSuppliedString;
      if (!openid_url.match(/^http/))
       {
        warning += '"http" not included at start of "' + openid_url + '".<br />\n';
	openid_url = "http://" + userSuppliedString;
       }
      if (openid_url.match(/\/$/))
       {
        warning += '"/" included at end of "' + openid_url + '".<br />\n';
	openid_url = openid_url.substring(0,openid_url.length-1);
       }
      app.log("warning: " + warning);
      var discoveries = manager.discover(openid_url);
      var discovered = manager.associate(discoveries);
      session.data["openid-disco"] = discovered;
      var realmVerifier = new Packages.org.openid4java.server.RealmVerifier();
      realmVerifier.setEnforceRpId(false);
      manager.setRealmVerifier(realmVerifier);
      var authReq = manager.authenticate(discovered, returnToURL, realm);
      app.log("authReq=" + authReq);
      var destinationURL = "" + authReq.getDestinationUrl(true);
      var fetch = Packages.org.openid4java.message.ax.FetchRequest.createFetchRequest();
      fetch.addAttribute
       (
        "email", 
        "http://schema.openid.net/contact/email",
        true
       );
      authReq.addExtension(fetch);
      if (!discovered.isVersion2())
       {
        app.log("Redirecting to " + destinationURL);
        res.redirect(destinationURL);
        return (null);
       }
      else
       {
        app.log("Discovery is not version 2.  Redirecting to " + destinationURL);
        res.redirect(destinationURL);
        return (null);
       }
     }
    catch (e)
     {
      app.log("Exception: " + e);
     }
    return (null);
   }

  function verifyResponse (uri, queryString)
   {
    try
     {
      var manager = getManager();
      var discovered = session.data["openid-disco"];
      var receivingURL = uri + "?" + queryString;
      var parameterList =
       Packages.org.openid4java.message.ParameterList.createFromQueryString(queryString);
      var verification = manager.verify(receivingURL, parameterList, discovered);
      var verified = verification.getVerifiedId();
      if (verified != null)
       {
        var name = "" + verified;
	name = name.replace(/^http\:\/\//, "").replace(/\/$/, "");
        var user = app.getUser(name);
        if (!user)
	 {
	  user = app.registerUser(name, "password");
	 }
        if (user)
	 {
	  app.log("Logging in as " + name);
	  session.login(user);
	 }
        authSuccess = verification.getAuthResponse();
        if (authSuccess.hasExtension(Packages.org.openid4java.message.ax.AxMessage.OPENID_NS_AX))
         {
          var fetchResp = 
           authSuccess.getExtension(Packages.org.openid4java.message.ax.AxMessage.OPENID_NS_AX);
          var emails = fetchResp.getAttributeValues("email");
          var email = emails.get(0);
	  return (email);
         }
        return (verified);
       }
     }
    catch (e)
     {
      app.log("Exception: " + e);
      return (true);
     }
    return (false);
   }

  updateUserState();

  var promptString = "";
  if(session.user)
   {
    promptString += '<ul>';
    promptString += ' <li>' + session.user["name"] + '</li>';
    promptString += ' <li><form method="post"><input type="hidden" name="logout" value="true" /><button type="submit">Logout</button></form></li>';
    promptString += ' <li class="last"><a href="">Edit</a></li>';
    promptString += '</ul>\n';
   }
  else
   {
    promptString += '<ul>';
    promptString += ' <li>';
    //promptString += '  <form method="post" action="' + root.href() + '">\n';
    promptString += '  <form method="post" action="">\n';
    promptString += '   <input type="text" id="openid_url" name="openid_url" />\n';
    promptString += '   <button type="submit">Login</button>\n';
    promptString += '  </form>\n';
    promptString += ' </li>';
    promptString += ' <li class="last"><a href="">Register</a></li>';
    promptString += '</ul>\n';
   }
  return (promptString);
 }

