//toggle show/hide
function toggleVisibility(node, status) {
  node.style.visibility = status ? 'initial' : 'hidden';
}

//check for the local storage
function hasLocalStorage(){
  try {
      return 'localStorage' in window && window['localStorage'] !== null;
  } catch(e) {
      return false;
  }
}

//clean modal before opening a new one
function cleanModal(){
  document.getElementById('modal-img').src = '';
  document.getElementById('modal-user-img').src = '';
}

//create Dom nodes
function createDOM(el, contents, attr, value) {
  var node = document.createElement(el);
  if (contents !== null && contents.length > 0) {
    node.appendChild(document.createTextNode(contents));
  }
  if (attr) {
    var att = document.createAttribute(attr);
    att.value = value;
    node.setAttributeNode(att);
  }
  return node;
}

//Progress bar - the server doesn't send a Content-Length header in the response, so I am faking it
var wrapper_elt = document.querySelector('.progress-wrap');
var progress_elt = document.querySelector('.progress-bar');
var progress = 0; 
var width = wrapper_elt.getBoundingClientRect().width;

function update(progress) {
  var percent = progress / 100;
  var total = percent * width;    
  progress_elt.style.left = Math.floor(total) + 'px';
};

function make_loop(val, duration) {
  var current = 0;
  var tsinc = duration / val;
  var loop = function() {
    if( current <= val ) {
      update(current++);
      window.setTimeout(loop, tsinc);
    }
    else
      progress_elt.style.left = 0 + 'px';
  }
  loop();
};