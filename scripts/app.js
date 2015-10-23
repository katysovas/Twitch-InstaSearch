document.addEventListener('DOMContentLoaded', function() { 
  
  //global settings
  var twitchSettings = {
    totalResults: 0,
    maxPages: 1,
    limit: 10,
    page: 1,
    prev: '',
    next: '',
    url: '',
    query: '',
    streamItem: null, 
    localStorageMaxItems: 30
  }

  //caching DOM
  var searchInput = document.getElementById('search-input');
  var totalResults = document.getElementById('total-results');
  var navigationNode = document.getElementById('navigation'); 
  var nextPage = document.getElementById('nextPage');
  var prevPage = document.getElementById('prevPage');
  var filterOption = document.querySelectorAll('.filter');  
  var modalClose = document.getElementById('modal-close');  
  
  //binding instant search  
  var timer;  
  searchInput.addEventListener('keyup', function(e){
    e.preventDefault();    
    twitchSettings.query = e.currentTarget.value;
    twitchSettings.url = 'https://api.twitch.tv/kraken/search/streams?limit=' + twitchSettings.limit + '&q=' + twitchSettings.query;
  
    timer && clearTimeout(timer);
    if (twitchSettings.query.length > 3){
      timer = setTimeout(function(){
      twitchSettings.page = 1;
      searchAPI(twitchSettings.url);      
      }, 500);
    }
  });

  //hide results and the result header on x
  searchInput.addEventListener('search', function(e){
    if(e.currentTarget.value == ''){
      totalResults.innerHTML = 0;
      document.getElementById('results-list').innerHTML = '';
      toggleVisibility(navigationNode, 0);
      toggleVisibility(prevPage, 0);
      toggleVisibility(nextPage, 0);
      twitchSettings.page = 1;
    }
  });

  //option to display the number of the results
  for (var i = 0; i < filterOption.length; i++) {
    filterOption[i].addEventListener('click', function(e) {
      [].forEach.call(filterOption, function(div) {
         div.className = '';
      });
      twitchSettings.limit = e.currentTarget.text;
      e.currentTarget.className = e.currentTarget.className + ' active';
      twitchSettings.url = 'https://api.twitch.tv/kraken/search/streams?limit=' + twitchSettings.limit + '&q=' + twitchSettings.query;
      searchAPI(twitchSettings.url);
      twitchSettings.page = 1;
      e.preventDefault();        
    });
  } 

  //bind page navigation
  nextPage.addEventListener('click', function(e) {
    navigatePage(1);
  });
  prevPage.addEventListener('click', function(e) {
    navigatePage(0);
  });

  function navigatePage(direction) {
    if (direction && twitchSettings.page < twitchSettings.maxPages) {
      var navUrl = twitchSettings.next;
      twitchSettings.page++;
    } else if (!direction && twitchSettings.page > 1) {
      navUrl = twitchSettings.prev;
      twitchSettings.page--;
    } else {
      return;
    }
    searchAPI(navUrl);
  }

  //https://github.com/justintv/Twitch-API/blob/master/v3_resources/search.md#get-searchstreams
  function searchAPI(url) {

    //check local storage first
    if (hasLocalStorage() && localStorage.getItem(url)){
      updateDOM(JSON.parse(localStorage.getItem(url)));
    }
    else{
      if (window.XMLHttpRequest) {
        var httpRequest = new XMLHttpRequest();
      } else if (window.ActiveXObject) {  //IE
        try {
          httpRequest = new ActiveXObject('Msxml2.XMLHTTP');
        } 
        catch (e) {
          try {
            httpRequest = new ActiveXObject('Microsoft.XMLHTTP');
          } 
          catch (e) {}
        }
      }
      if (!httpRequest) {
        return false;
      }

      httpRequest.onreadystatechange = function(){
        if (httpRequest.readyState == XMLHttpRequest.DONE) {
          if (httpRequest.status === 200) {   
            var results = httpRequest.responseText;         
            updateDOM(JSON.parse(results));

            //add to local storage if we have any results
            if (hasLocalStorage && JSON.parse(results)._total > 0){
              make_loop(100, 1000);
              
              //clear if over capacity
              if (localStorage.length > twitchSettings.localStorageMaxItems)
                localStorage.clear();

              localStorage.setItem(twitchSettings.url, results);
            }
          } else {
            console.log(results);
          }
        }
      }
      httpRequest.open('GET', url);
      httpRequest.setRequestHeader('Accept', 'application/vnd.twitchtv.v3+json');
      httpRequest.send();
    }
  }  

  // create a content of the modal
  function createModalDOM(modalData){

    if (modalData.game)
      document.getElementById('modal-title').innerHTML = modalData.game;

    if (modalData.preview.large)
      document.getElementById('modal-img').src = modalData.preview.large;  

    if (modalData.channel.logo)
      document.getElementById('modal-user-img').src = modalData.channel.logo;

    if (modalData.channel.display_name && modalData.channel.url){
      var usernameInfo = document.getElementById('modal-username')
      usernameInfo.innerHTML = modalData.channel.display_name;
      usernameInfo.href = modalData.channel.url;
    }         
  }

  // update the streams DOM
  function updateDOM(streamItem) {
    // update streamItem
    twitchSettings.streamItem = streamItem.streams;
    var parent = document.getElementById('results-list');  

    //clear previous dom
    parent.innerHTML = '';

    twitchSettings.streamItem.forEach(function(stream) {
      parent.appendChild(createStreamList(stream));
    });

    //create Modal 
    var streams = document.querySelectorAll('.openMe');    
    for (var i = 0; i < streams.length; i++) {
      streams[i].addEventListener('click', function(e) {

            //clear previous dom
            cleanModal();

            var parent = e.currentTarget.parentNode;
            var id = parent.getAttribute('data-id');
        
            //lets find our item
            for (var key in twitchSettings.streamItem) {
              if (twitchSettings.streamItem.hasOwnProperty(key)) {
                var obj = twitchSettings.streamItem[key];
                if (obj._id == id) { 
                  createModalDOM(obj);
                  return;
                }
              }
            }
            e.preventDefault();        
      });
    }    

    // update the results count
    twitchSettings.totalResults = streamItem._total;
    totalResults.innerHTML = twitchSettings.totalResults;
    
    if (twitchSettings.totalResults) {
      toggleVisibility(navigationNode, 1);

      //show hide navigation arrows
      var pageStatus = navigationNode.children[1];
      twitchSettings.next = streamItem._links.next;
      twitchSettings.prev = streamItem._links.prev;
      twitchSettings.maxPages = Math.ceil(streamItem._total / twitchSettings.limit);
      pageStatus.firstChild.innerHTML = twitchSettings.page;
      pageStatus.lastChild.innerHTML = twitchSettings.maxPages;

      var firstPage = twitchSettings.page === 1 ? 0 : 1;
      var lastPage = twitchSettings.page === twitchSettings.maxPages ? 0 : 1;
  
      toggleVisibility(prevPage, firstPage);
      toggleVisibility(nextPage, lastPage);

    } else {
      toggleVisibility(navigationNode, 0);
      toggleVisibility(prevPage, 0);
      toggleVisibility(nextPage, 0);
    }

  }

  // create stream list dom
  function createStreamList(stream) {

    var streamItem = createDOM('div', '', 'class', 'stream');
    var imageUrl = stream.preview.template.replace(/{width}/, 160).replace(/{height}/, 90);
    var imageDOM = createDOM('a', '', 'href', '#openModal');
    var infoDOM = createDOM('div', '', 'class', 'stream-info');
    var titleDOM = createDOM('h2', '');
    var descriptionDOM = createDOM('div', '', 'class', 'stream-description');
    var gameDOM = createDOM('p', '');

    gameDOM.appendChild(createDOM('a', stream.game, 'href', 'http://www.twitch.tv/directory/game/' + stream.game));
    gameDOM.appendChild(document.createTextNode(' - ' + stream.viewers + ' viewers'));
    descriptionDOM.appendChild(gameDOM);
    descriptionDOM.appendChild(createDOM('p', stream.channel.status));    
    titleDOM.appendChild(createDOM('a', stream.channel.display_name, 'href', stream.channel.url));
    imageDOM.className = imageDOM.className + 'openMe';
    infoDOM.appendChild(titleDOM);
    infoDOM.appendChild(descriptionDOM);
    imageDOM.appendChild(createDOM('img', '', 'src', imageUrl));
    streamItem.setAttribute('data-id',stream._id);
    streamItem.appendChild(imageDOM);
    streamItem.appendChild(infoDOM);

    return streamItem;
  }
});createDOM