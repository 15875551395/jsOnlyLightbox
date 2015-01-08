"use strict"

/**
 * jsOnlyLightbox v0.5
 * Copyright © 2014 Felix Hagspiel - http://jslightbox.felixhagspiel.de
 *
 * @license MIT
 * - Free for use in both personal and commercial projects
 */

function Lightbox () {

	/**
	 * Private vars
	 */
	var CTX = this,
		isIE8 = false,
		isIE9 = false,
		body = document.getElementsByTagName('body')[0],
		template = '<div class="jslghtbx-contentwrapper" id="jslghtbx-contentwrapper" ></div>',
		captionTemplate = '<p class="jslghtbx-caption"></p>',
		imgRatio = false, // ratio of current image
		currGroup = false, // current group
		currThumbnail = false, // first clicked thumbnail
		currImage = {}, // currently shown image
		currImages = [], // images belonging to current group
		thumbnails = [], // thumbnails
		isOpen = false, // check if box is open
		loadingImgSrc, // path to loading image
		animationEl, // reference to animation-element
		animationInt, // animation-interval
		animationChildren = [], // childs to animate
		animationTimeout, // timeout until animation starts
		// controls
		nextBtn = false,
		prevBtn = false,
		// resize-vars
		maxWidth,
		maxHeight,
		wrapperWidth,
		wrapperHeight,
		newImgWidth,
		newImgHeight

	/**
	 * Public vars
	 */
	CTX.opt = {}
	CTX.box = false
	CTX.wrapper = false

	/**
	 * Private methods
	 */

	/**
	 * Get correct height in IE8
	 * @return {Number}
	 */
	function getHeight(){
		return window.innerHeight || document.documentElement.offsetHeight
	}

	/**
	 * Get correct width in IE8
	 * @return {Number}
	 */
	function getWidth(){
		return window.innerWidth || document.documentElement.offsetWidth
	}

	/**
	 * Adds eventlisteners cross browser
	 * @param {Object}   el       The element which gets the listener
	 * @param {[type]}   e        The event type
	 * @param {Function} callback The action to execute on event
	 * @param {[type]}   val      The capture mode
	 */
	function addEvent(el,e,callback,capture){
	    if (el.addEventListener) {
	        el.addEventListener(e,callback, capture || false)
	    } else if (el.attachEvent) {
	        el.attachEvent("on" + e, callback)
	    }
	}

	// check if element has a specific class
	function hasClass(el,className) {
		if(!el || !className){return}
	    return (new RegExp("(^|\\s)" + className + "(\\s|$)").test(el.className))
	}

	// remove class from element
	function removeClass(el,className) {
		if(!el || !className){return}
	    el.className = el.className.replace(new RegExp('(?:^|\\s)'+className+'(?!\\S)'),'' )
	    return el
	}

	// add class to element
	function addClass(el,className) {
		if(!el || !className){return}
	    if(!hasClass(el,className)) { el.className += ' '+className }
	    return el
	}

	// check if obj is set
	function isset(obj) {
		if(typeof obj != 'undefined'){return true}
		return false
	}

	// get attributes, cross-browser
	function getAttr(obj,attr) {
		if(!obj || typeof obj == undefined){return false}
		var ret
		if(obj.getAttribute){ret=obj.getAttribute(attr)}
		else if(obj.getAttributeNode){ret=obj.getAttributeNode(attr).value}
		if(typeof ret != undefined && ret != ''){return ret}
		return false
	}

	// check attribute, cross-browser
	function hasAttr(obj,attr) {
		if(!obj || typeof obj == undefined){return false}
		var ret
		if(obj.getAttribute){ret=obj.getAttribute(attr)}
		else if(obj.getAttributeNode){ret=obj.getAttributeNode(attr).value}
		if(typeof ret === 'string'){return true}
		return false
	}

	// lookup element in browser
	function exists(id){
		if(document.getElementById(id)) {return true}
		return false
	}

	// preload next and prev images
	function preload(){
		if(!currGroup){return}
		var prev = new Image()
		var next = new Image()
		var pos = getPos(currThumbnail,currGroup)
		if(pos === (currImages.length - 1)) {
			prev.src = currImages[currImages.length - 1].src
			next.src = currImages[0].src
		} else if(pos === 0) {
			prev.src = currImages[currImages.length - 1].src
			next.src = currImages[1].src
		} else {
			prev.src = currImages[pos - 1].src
			next.src = currImages[pos + 1].src
		}
	}

	// add clickhandlers to thumbnails
	function clckHlpr(i) {
		addEvent(i,'click',function(e) {
			currGroup = getAttr(i, 'data-jslghtbx-group') || false
			currThumbnail = i
			openBox(i,false,false)
		},false)
	}

	// get thumbnails by group
	function getByGroup(group) {
		var arr = []
		for (var i = 0; i < thumbnails.length; i++) {
			if(getAttr(thumbnails[i],'data-jslghtbx-group') === group) {
				arr.push(thumbnails[i])
			}
		}
		return arr
	}

	// get position of thumbnail in group-array
	function getPos(thumbnail, group) {
		var arr = getByGroup(group)
		for (var i = 0; i < arr.length; i++) {
			if(getAttr(thumbnail,'src') === getAttr(arr[i],'src') &&
				getAttr(thumbnail,'data-jslghtbx') === getAttr(arr[i],'data-jslghtbx') ){
				return i
			}
		}
	}

	// cross-browser stoppropagation
	function stopPropagation(e) {
		if(e.stopPropagation) {e.stopPropagation()}
		else {e.returnValue=false}	
	}

	// check if option is set
	function chckOpt(opt,name) {
		return !opt || opt && opt[name]
	}

	// check if callback is set
	function chckCb(opt,name) {
		return opt && opt[name] && typeof opt[name] === 'function'
	}

	// start animation
	function startAnimation() {
		if(isIE8) return
		// stop any already running animations
		stopAnimation()
		var fnc = function() {
			addClass(CTX.box,'jslghtbx-loading')
			if(!isIE9 && typeof CTX.opt.loadingAnimation === 'number'){
				var index = 0
				animationInt = setInterval(function(){
					addClass(animationChildren[index],'jslghtbx-active')
					setTimeout(function(){
						removeClass(animationChildren[index],'jslghtbx-active')
					},CTX.opt.loadingAnimation)
					index = index >= animationChildren.length ? 0 : index += 1
				},CTX.opt.loadingAnimation)
			}			
		}
		// set timeout to not show loading animation on fast connections
		animationTimeout = setTimeout(fnc,500)
	}

	// stop animation
	function stopAnimation() {
		if(isIE8) return
		// hide animation-element
		removeClass(CTX.box,'jslghtbx-loading')
		// stop animation
		if(!isIE9 && typeof CTX.opt.loadingAnimation !== 'string' && CTX.opt.loadingAnimation){
			clearInterval(animationInt)
			// do not use animationChildren.length here due to IE8/9 bugs
			for(var i = 0; i < animationChildren.length; i++) {
				removeClass(animationChildren[i],'jslghtbx-active')
			}
		}
	}

	// init controls
	function initControls() {
		if(!nextBtn) {
			// create & append next-btn
			nextBtn = document.createElement('span')
			addClass(nextBtn,'jslghtbx-next')

			// add custom images
			if(CTX.opt['nextImg']) {
				var nextBtnImg = document.createElement('img')
				nextBtnImg.setAttribute('src', CTX.opt['nextImg'])
				nextBtn.appendChild(nextBtnImg)
			} else {
				addClass(nextBtn,'jslghtbx-no-img')
			}
			addEvent(nextBtn,'click',function(e){
				stopPropagation(e) // prevent closing of lightbox
				CTX.next()
			},false)
			CTX.box.appendChild(nextBtn)
		}
		addClass(nextBtn,'jslghtbx-active')
		if(!prevBtn) {
			// create & append next-btn
			prevBtn = document.createElement('span')	
			addClass(prevBtn,'jslghtbx-prev')

			// add custom images
			if(CTX.opt['prevImg']) {
				var prevBtnImg = document.createElement('img')
				prevBtnImg.setAttribute('src', CTX.opt['prevImg'])
				prevBtn.appendChild(prevBtnImg)
			} else {
				addClass(prevBtn,'jslghtbx-no-img')
			}
			addEvent(prevBtn,'click',function(e){
				stopPropagation(e) // prevent closing of lightbox
				CTX.prev()
			},false)
			CTX.box.appendChild(prevBtn)			
		}
		addClass(prevBtn,'jslghtbx-active')
	}

	// move controls to correct position
	function repositionControls() {
		if(CTX.opt.responsive && nextBtn && prevBtn) {
			var btnTop = (getHeight() / 2) - (nextBtn.offsetHeight / 2)
			nextBtn.style.top = btnTop+"px"
			prevBtn.style.top = btnTop+"px"
		}
	}

	// set options
	function setOpt(opt){
		// set options
		if(!opt) opt = {}
		// 	sets the value per default to true if not given
		function setTrueDef(val){
			return typeof val === 'boolean' ? val : true
		}
		CTX.opt = {
			// options
			boxId: 				opt['boxId'] || false,
			controls: 			setTrueDef(opt['controls']),
			dimensions: 		setTrueDef(opt['dimensions']),
			captions: 			setTrueDef(opt['captions']),
			prevImg: 			typeof opt['prevImg'] === 'string' ? opt['prevImg'] : false,
			nextImg: 			typeof opt['nextImg'] === 'string' ? opt['nextImg'] : false,
			hideCloseBtn: 		opt['hideCloseBtn'] || false,
			closeOnClick: 		typeof opt['closeOnClick'] === 'boolean' ? opt['closeOnClick'] : true,
			loadingAnimation: 	opt['loadingAnimation'] === undefined ? true : opt['loadingAnimation'],
			animElCount: 		opt['animElCount'] || 4,
			preload: 			setTrueDef(opt['preload']),
			carousel: 			setTrueDef(opt['carousel']),
			animation: 			opt['animation'] || 400,
			nextOnClick: 		setTrueDef(opt['nextOnClick']),
			responsive: 		setTrueDef(opt['responsive']),
			// callbacks
			onopen: 			opt['onopen'] || false,
			onclose: 			opt['onclose'] || false,
			onload: 			opt['onload'] || false,
			onresize: 			opt['onresize'] || false,
		}

		// load box in custom element
		if(CTX.opt['boxId']) {
			CTX.box = document.getElementById(CTX.opt['boxId'])
		}
		// create box element if no ID is given
		else if(!CTX.box && !exists('jslghtbx')) {
			var newEl = document.createElement('div')
			newEl.setAttribute('id','jslghtbx')
			newEl.setAttribute('class','jslghtbx')
			CTX.box = newEl
			body.appendChild(CTX.box)
		}
		CTX.box.innerHTML = template
		if(isIE8) {
			addClass(CTX.box,'jslghtbx-ie8')
		}
		CTX.wrapper = document.getElementById('jslghtbx-contentwrapper')

		// init regular closebutton
		if(!CTX.opt['hideCloseBtn']) {
			var closeBtn = document.createElement('span')
			closeBtn.setAttribute('id','jslghtbx-close')
			closeBtn.setAttribute('class','jslghtbx-close')
			closeBtn.innerHTML = 'X'
			CTX.box.appendChild(closeBtn)
			addEvent(closeBtn,'click',function(e){
				stopPropagation(e)
				CTX.close()
			},false)
		}

		// close lightbox on background-click by default / if true
		if(!isIE8 && CTX.opt['closeOnClick']) {
			addEvent(CTX.box,'click',function(e){
				CTX.close()
			},false)
		}

		// set loading animation
		if(typeof CTX.opt['loadingAnimation'] === 'string') {
			// set loading GIF
			animationEl = document.createElement('img')
			animationEl.setAttribute('src',CTX.opt['loadingAnimation'])
			addClass(animationEl,'jslghtbx-loading-animation')
			CTX.box.appendChild(animationEl)
		} else if(CTX.opt['loadingAnimation']) {
			// set default animation time
			CTX.opt['loadingAnimation'] = typeof CTX.opt['loadingAnimation'] === 'number' ? CTX.opt['loadingAnimation'] : 200
			// create animation elements
			animationEl = document.createElement('div')
			addClass(animationEl,'jslghtbx-loading-animation')
			var i = 0
			while(i < CTX.opt['animElCount'] ) {
				animationChildren.push(animationEl.appendChild(document.createElement('span')))
				i++
			}
			CTX.box.appendChild(animationEl)
		}

		// add resize-eventhandlers
		if(CTX.opt['responsive']) {
			addEvent(window,'resize',function(e){
				CTX.resize()
			},false)
			addClass(CTX.box,'jslghtbx-nooverflow') // hide scrollbars on prev/next
		} 
		else {
			removeClass(CTX.box,'jslghtbx-nooverflow')
		}
	}

	/**
	 * Opens the lightbox. Either @param el and @param group must be given,
	 * but not both together!
	 * @param  {Object || String}   el    	an image element or a link to an image
	 * @param  {String}   group 			the name of an image group
	 * @param  {Function} cb    			A private callback
	 */
	function openBox(el,group,cb) {
		if(!el && !group){return false}

		// save images from group
		currGroup = group || currGroup || getAttr(el,'data-jslghtbx-group')
		if(currGroup) {
			currImages = getByGroup(currGroup)
			if(typeof el === 'boolean' && !el) {
				// el is set to false, load first image of group
				el = currImages[0]				
			}
		}

		// create new img-element
		currImage.img = new Image()

		// set el as current thumbnail
		currThumbnail = el

		// get correct image-source
		var src
		if(typeof el === 'string') {
			// string with img-src given
			src = el
		}
		else if(getAttr(el,'data-jslghtbx')) {
			// image-source given
			src =  getAttr(el,'data-jslghtbx')
		}
		else {
			// no image-source given
			src =  getAttr(el,'src')
		}
		// clear old image ratio for proper resize-values
		imgRatio = false 

		// add init-class on opening, but not at prev/next
		if(!isOpen) {
			if(typeof CTX.opt.animation === 'number') {
				addClass(currImage.img,'jslghtbx-animate-transition jslghtbx-animate-init')
			}
			isOpen = true
			
			// execute open callback
			if(CTX.opt.onopen) CTX.opt.onopen()
		}
		
		// hide overflow by default / if set
		if(!CTX.opt || !isset(CTX.opt.hideOverflow) || CTX.opt.hideOverflow ) {
			body.setAttribute('style','overflow: hidden')
		}

		CTX.box.setAttribute('style','padding-top: 0')
		CTX.wrapper.innerHTML = ''
		CTX.wrapper.appendChild(currImage.img)
		// set animation class
		if(CTX.opt['animation']) addClass(CTX.wrapper,'jslghtbx-animate')
		// set caption
		var captionText = getAttr(el,'data-jslghtbx-caption')
		if(captionText && CTX.opt.captions) {
			var caption = document.createElement('p')
			caption.setAttribute('class','jslghtbx-caption')
			caption.innerHTML = captionText
			CTX.wrapper.appendChild(caption)			
		}

		addClass(CTX.box,'jslghtbx-active')

		// show wrapper early to avoid bug where dimensions are not
		// correct in IE8
		if(isIE8) {
			addClass(CTX.wrapper,'jslghtbx-active')
		}
		if(CTX.opt.controls && currImages.length > 1) {
			initControls()
			repositionControls()
		}

		// show wrapper when image is loaded
		currImage.img.onload = function(){
			// store original width here
			currImage.originalWidth = this.naturalWidth || this.width
			currImage.originalHeight = this.naturalHeight || this.height	
			// use dummyimage for correct dimension calculating in older IE
			if(isIE8 || isIE9) {
				var dummyImg = new Image()
				dummyImg.setAttribute('src',src)
				currImage.originalWidth = dummyImg.width
				currImage.originalHeight = dummyImg.height	
			}
			var checkClassInt = setInterval(function(){
				if(hasClass(CTX.box,'jslghtbx-active'))
				{
					addClass(CTX.wrapper,'jslghtbx-wrapper-active')
					// set animation
					if(typeof CTX.opt.animation === 'number') {
						addClass(currImage.img,'jslghtbx-animate-transition')
					}
					if(cb) cb()
					// stop Animation
					stopAnimation()
					// clear animation timeout
					clearTimeout(animationTimeout)
					// preload previous and next image
					if(CTX.opt.preload) {
						preload()
					}
					// set clickhandler to show next image
					if(CTX.opt.nextOnClick) {
						// add cursor pointer
						addClass(currImage.img,'jslghtbx-next-on-click')
						addEvent(currImage.img,'click',function(e){
							stopPropagation(e)
							CTX.next()
						},false)
					}
					// execute onload callback
					if(CTX.opt.onload) CTX.opt.onload()
					clearInterval(checkClassInt)
					CTX.resize()
				}
			},10)				
		}

		// set src 
		currImage.img.setAttribute('src',src)

		// start loading animation
		startAnimation()
	}

	/*
	* 	Public methods
	*/

	// init-function
	CTX.load = function(opt) {
		// check for IE8
		if(navigator.appVersion.indexOf("MSIE 8") > 0) {
			isIE8 = true
		}

		// check for IE9
		if(navigator.appVersion.indexOf("MSIE 9") > 0) {
			isIE9 = true
		}

		// set options
		setOpt(opt)

		// Find all thumbnails & add clickhandlers
		var arr = document.getElementsByTagName('img')
		for(var i = 0; i < arr.length; i++)
		{
			if(hasAttr(arr[i],'data-jslghtbx')) {
				thumbnails.push(arr[i])
				clckHlpr(arr[i])
			}
		}

	}
	// public caller for openBox()
	CTX.open = function(el,group){
		// if image and group are given, set group to false
		// to prevent errors
		if(el && group) group = false
		openBox(el,group,false)
	}
	// resize function
	CTX.resize = function() {
		if(!currImage.img){return}
		maxWidth = getWidth()
		maxHeight = getHeight()
		var boxWidth = CTX.box.offsetWidth
		var boxHeight = CTX.box.offsetHeight
		if(!imgRatio && currImage.img && currImage.img.offsetWidth && currImage.img.offsetHeight) {
			imgRatio = currImage.img.offsetWidth / currImage.img.offsetHeight
		}

		// Height of image is too big to fit in viewport
		if( Math.floor(boxWidth/imgRatio) > boxHeight ) {
			newImgWidth = boxHeight*imgRatio*0.8
			newImgHeight = boxHeight*0.8
		}
		// Width of image is too big to fit in viewport
		else {
			newImgWidth = boxWidth*0.8
			newImgHeight = boxWidth/imgRatio*0.8
		}
		newImgWidth = Math.floor(newImgWidth)
		newImgHeight = Math.floor(newImgHeight)
		
		// check if image exceeds maximum size
		if( CTX.opt.dimensions && newImgHeight > currImage.originalHeight ||
			CTX.opt.dimensions && newImgWidth > currImage.originalWidth) {
			newImgHeight = currImage.originalHeight
			newImgWidth = currImage.originalWidth
		}
		currImage.img.setAttribute('width',newImgWidth)
		currImage.img.setAttribute('height',newImgHeight)
		currImage.img.setAttribute('style','margin-top:'+((getHeight() - newImgHeight) /2)+'px')

		// reposition controls after timeout
		setTimeout(repositionControls,200)

		// execute resize callback
		if(CTX.opt.onresize) CTX.opt.onresize()
	}

	// show next image
	CTX.next = function() {
		if(!currGroup){return}
		// get position of next image
		var pos = getPos(currThumbnail,currGroup) + 1  
		if(currImages[pos]) {
			currThumbnail = currImages[pos]	
		} 
		else if(CTX.opt.carousel) {
			currThumbnail = currImages[0]
		}
		else {
			return
		}
		if(typeof CTX.opt.animation === 'number') {
			removeClass(currImage.img,'jslghtbx-animating-next')
			setTimeout(function(){
				var cb = function(){
					setTimeout(function(){
						addClass(currImage.img,'jslghtbx-animating-next')
					},CTX.opt.animation / 2)					
				}
				openBox(currThumbnail,false,cb)
			},CTX.opt.animation / 2)
		}
		else {
			openBox(currThumbnail,false,false)
		}
	}

	// show prev image
	CTX.prev = function() {
		if(!currGroup){return}
		// get position of prev image
		var pos = getPos(currThumbnail,currGroup) - 1 
		if(currImages[pos]) {
			currThumbnail = currImages[pos]	
		}
		else if(CTX.opt.carousel) {
			currThumbnail = currImages[currImages.length - 1]
		}
		else {
			return
		}
		// animation stuff
		if(typeof CTX.opt.animation === 'number') {
			removeClass(currImage.img,'jslghtbx-animating-prev')
			setTimeout(function(){
				var cb = function(){
					setTimeout(function(){
						addClass(currImage.img,'jslghtbx-animating-next')
					},CTX.opt.animation / 2)					
				}
				openBox(currThumbnail,false,cb)
			},CTX.opt.animation / 2)
		}
		else {
			openBox(currThumbnail,false,false)
		}
	}
	// closes the box
	CTX.close = function() {
		// restore Defaults
		currGroup = false
		currThumbnail = false
		currImage = {}
		currImages = []
		isOpen = false
		removeClass(CTX.box,'jslghtbx-active')
		removeClass(CTX.wrapper,'jslghtbx-wrapper-active')
		removeClass(nextBtn,'jslghtbx-active')
		removeClass(prevBtn,'jslghtbx-active')
		CTX.box.setAttribute('style','padding-top: 0px')

		// stop animtation
		stopAnimation()

		// Hide Lightbox if iE8
		if(isIE8) {
			CTX.box.setAttribute('style','display: none')
		}

		// show overflow by default / if set
		if(!CTX.opt ||  !isset(CTX.opt.hideOverflow) || CTX.opt.hideOverflow ) {
			body.setAttribute('style','overflow: auto')
		}

		// execute close callback
		if(CTX.opt.onclose) CTX.opt.onclose()
	}
}

