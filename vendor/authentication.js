var myHeaders = new Headers();
myHeaders.set('Cache-Control', 'no-store');
var urlParams = new URLSearchParams(window.location.search);
var appClientId = "k1snulk0m00s9t7c5t76mdiq5";
var redirectURI = "https://d3ckp6wzau4cz8.cloudfront.net/index.html";
var authorizationURL = "https://uohsmruw86.execute-api.us-east-1.amazonaws.com/dev/"

var el = document.getElementById('login');
el.onclick = signInUp;

var logo = document.getElementById('logout');
logo.onclick = logout;
logo.style.display = "none";

//Generate a Random String
const getRandomString = () => {
    const randomItems = new Uint32Array(28);
    crypto.getRandomValues(randomItems);
    const binaryStringItems = randomItems.map(dec => `0${dec.toString(16).substr(-2)}`)
    return binaryStringItems.reduce((acc, item) => `${acc}${item}`, '');
}

//Encrypt a String with SHA256
const encryptStringWithSHA256 = async str => {
    const PROTOCOL = 'SHA-256'
    const textEncoder = new TextEncoder();
    const encodedData = textEncoder.encode(str);
    return crypto.subtle.digest(PROTOCOL, encodedData);
}

//Convert Hash to Base64-URL
const hashToBase64url = arrayBuffer => {
    const items = new Uint8Array(arrayBuffer)
    const stringifiedArrayHash = items.reduce((acc, i) => `${acc}${String.fromCharCode(i)}`, '')
    const decodedHash = btoa(stringifiedArrayHash)

    const base64URL = decodedHash.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    return base64URL
}

async function signInUp() {
  var code = urlParams.get('code');
  
  //If code not present then request code else request tokens
  if (code == null){

    // Create random "state"
    var state = getRandomString();
    sessionStorage.setItem("pkce_state", state);

    // Create PKCE code verifier
    var code_verifier = getRandomString();
    sessionStorage.setItem("code_verifier", code_verifier);

    // Create code challenge
    var arrayHash = await encryptStringWithSHA256(code_verifier);
    var code_challenge = hashToBase64url(arrayHash);
    sessionStorage.setItem("code_challenge", code_challenge)

    // Redirtect user-agent to /authorize endpoint
    location.href = authorizationURL + "oauth2/authorize?response_type=code&state="+state+"&client_id="+appClientId+"&redirect_uri="+redirectURI+"&scope=openid&code_challenge_method=S256&code_challenge="+code_challenge;
  } else {

    // Verify state matches
    state = urlParams.get('state');
    if(sessionStorage.getItem("pkce_state") != state) {
        alert("Invalid state");
    } else {

    // Fetch OAuth2 tokens from API Gateway
    code_verifier = sessionStorage.getItem('code_verifier');
  await fetch(authorizationURL + "oauth2/token?grant_type=authorization_code&client_id="+appClientId+"&code_verifier="+code_verifier+"&redirect_uri="+redirectURI+"&code="+ code,{
  method: 'post',
  headers: {
    'Content-Type': 'application/json'
  }})
  .then((response) => {
    return response.json();
  })
  .then((data) => {
    
	localStorage.setItem("session", JSON.stringify(data));	
	
	//var url = window.location.href;
    //url = url.split('?')[0];
	window.history.pushState({}, document.title, "/index.html");
	logo.style.display = "block";
	document.getElementById("login").innerHTML = data.user_profile.name + ' ' + data.user_profile.family_name + '<br/>[' + data.user_profile.email + ']';
  });
	
  }
  }
  }  
  
  function logout(){
	localStorage.clear();	
	logo.style.display = "none";
	
	location.reload();
  }
  
  function getSession(){
	var session = localStorage.getItem("session");	
	if (session){
		return JSON.parse(session);
	}	
  }
  
  var code = null;
  var session = getSession();  
  if (session){
	  window.history.pushState({}, document.title, "/index.html");
	  document.getElementById("login").innerHTML = session.user_profile.name + ' ' + session.user_profile.family_name + '<br/>[' + session.user_profile.email + ']';
	  logo.style.display = "block";
  }
  else{
	  code = urlParams.get('code');
	  if (code != null){
		  signInUp();
	  }
  }