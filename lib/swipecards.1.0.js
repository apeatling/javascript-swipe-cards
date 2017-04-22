/*! JavaScript Swipe Cards
 * https://github.com/apeatling/javascript-swipe-cards
 *
 * Copyright (c) 2014 Andy Peatling <apeatling@gmail.com>;
 * Licensed under the MIT license */

var SwipeCards = (function () {
    'use strict';

    /**
     * @constant The speed cards will animate to completion with a fast drag
     * @type {number}
     */
    var ANIMATION_SPEED_FAST = 100;

    /**
     * @constant The speed cards will animate to completion with a slow drag
     * @type {number}
     */
    var ANIMATION_SPEED_SLOW = 300;

    /**
     * @constant The boundary to determine a fast or slow drag 0 (slow) to 3+ (very fast)
     * @type {number}
     */
    var DRAG_VELOCITY_BOUNDARY = 2;

    /**
     * @constant Fraction of the viewport to drag past to auto complete a card transition
     * @type {number}
     */
    var DRAG_WINDOW_FRACTION = 6;

    /**
     * Hold the hammer.js object
     * @type {object}
     */
    var h = {};

    /**
     * The before, active, and after card DOM elements
     * @type {object}
     */
    var cardEls = {};

    /**
     * The current drag direction from user input
     * @type {number}
     */
    var direction = Hammer.DIRECTION_NONE;

    /**
     * Easy shortener for handling adding and removing body classes.
     */
    var bodyClass = document.body.classList;

    /**
     * Initialize pull to refresh, hammer, and bind touch events.
     */
    var init = function() {
        _setCardEls();
        _bindTouchEvents();
    };

    /**
     * Initialize the hammer.js class, and bind drag events.
     */
    var _bindTouchEvents = function() {
        h = new Hammer.Manager(cardEls.active, { preventDefault: true });
        h.add( new Hammer.Pan({ direction: Hammer.DIRECTION_VERTICAL, threshold: 10 }) );
        h.on( 'panup', _drag );
        h.on( 'pandown', _drag );
        h.on( 'panend', _dragEnd );

        // While drag events are active, make sure touch events are accessible.
        for( var card in cardEls ) {
            cardEls[card].removeEventListener( 'touchstart', _disableTouch );
        }
    };

    /**
     * Unbind hammer.js drag events.
     */
    var _unbindTouchEvents = function() {
        h.off( 'panup', _drag );
        h.off( 'pandown', _drag );
        h.off( 'panend', _dragEnd );

        // While drag events are not active, block all touch events to stop scrolling.
        for( var card in cardEls ) {
            cardEls[card].addEventListener( 'touchstart', _disableTouch, false );
        }

        h.stop();
        h.destroy();
    };

    /**
     * Select the card elements from the DOM and store them in cardEls for easy access.
     */
    var _setCardEls = function() {
        cardEls.before = document.getElementsByClassName( 'before' )[0];
        cardEls.active = document.getElementsByClassName( 'active' )[0];
        cardEls.after = document.getElementsByClassName( 'after' )[0];
    };

    /**
     * On the dragdown event, transform the active and before card elements
     * to move with the drag.
     */
    var _drag = function(e) {
        var distancePercent = Math.round( ( e.distance / window.innerHeight ) * 100 );
        var opacity = ( distancePercent < 30 ) ? 30 : distancePercent;

        switch (e.offsetDirection) {
            case Hammer.DIRECTION_UP:
                cardEls.active.style.transform = cardEls.active.style.webkitTransform = 'translate3d( 0, ' + -e.distance + 'px, 0 )';
                cardEls.after.style.transform = cardEls.after.style.webkitTransform = 'translate3d( 0, ' + ( window.innerHeight - e.distance ) +  'px, 0 )';
                cardEls.after.style.opacity = '.' + opacity;
                break;
            case Hammer.DIRECTION_DOWN:
                cardEls.active.style.transform = cardEls.active.style.webkitTransform = 'translate3d( 0, ' + e.distance + 'px, 0 )';
                cardEls.before.style.transform = cardEls.before.style.webkitTransform = 'translate3d( 0, ' + ( -window.innerHeight + e.distance ) +  'px, 0 )';
                cardEls.before.style.opacity = '.' + opacity;
                break;
        }
    };

    /**
     * On the dragend event, determine if the drag animation should slide
     * the next card in, or restore the active card.
     */
    var _dragEnd = function( e ) {
        direction = e.offsetDirection;

        // Disable hammer and any touch events until animation is complete.
        _unbindTouchEvents();

        var animationSpeed = ( e.velocityY > DRAG_VELOCITY_BOUNDARY ) ? ANIMATION_SPEED_FAST : ANIMATION_SPEED_SLOW;

        cardEls.active.classList.add( 'animate' );

        var tr = 'all ' + animationSpeed + 'ms ease';
        for( var card in cardEls ) {
            var el = cardEls[card];
            el.style.transition = tr;
            el.style.WebkitTransition = tr;
            el.style.MozTransition = tr;
        }

        // When the transition is done shift around the active card.
        cardEls.active.addEventListener( 'transitionend', _shiftActiveCard, false );

        // Finish the transition after swipe.
        if ( Hammer.DIRECTION_UP === direction ) {
            _completeUpTransition( e );
        } else if (Hammer.DIRECTION_DOWN === direction) {
            _completeDownTransition( e );
        } else {
            console.log('direction not supported: ' + direction);
        }
    };

    /**
     * Change the active card class if the transition was a success.
     */
    var _shiftActiveCard = function( e ) {
        cardEls.active.classList.remove( 'animate' );

        [ 'animate', 'dragup-reset', 'drag-complete', 'dragup-complete', 'dragdown-reset', 'dragdown-complete' ].forEach( function( c ) {
            bodyClass.remove( c );
        } );

        for( var card in cardEls ) {
            cardEls[card].style.transition = '';
            cardEls[card].style.transform = cardEls[card].style.webkitTransform = '';
            cardEls[card].style.opacity = '';
        }

        cardEls.active.removeEventListener( 'transitionend', _shiftActiveCard, false );

        // If the transition to a new card was successful then shift cards
        if ( cardEls.active.classList.contains( 'drag-complete' ) ) {
            _setCardClasses();
        }

        // Reselect card elements and their new classes.
        _setCardEls();

        _bindTouchEvents();
    };

    /**
     * Set the classes on each card, depending on the completed drag direction.
     */
    var _setCardClasses = function() {
        var beforeCardClass = cardEls.before.classList;
        var activeCardClass = cardEls.active.classList;
        var afterCardClass = cardEls.after.classList;

        if ( Hammer.DIRECTION_UP === direction ) {
            beforeCardClass.remove( 'before' );
            beforeCardClass.add( 'after' );

            activeCardClass.remove( 'active' );
            activeCardClass.remove( 'drag-complete' );
            activeCardClass.add( 'before' );

            afterCardClass.remove( 'after' );
            afterCardClass.add( 'active' );
        } else if (Hammer.DIRECTION_DOWN === direction) {
            beforeCardClass.remove( 'before' );
            beforeCardClass.add( 'active' );

            activeCardClass.remove( 'active' );
            activeCardClass.remove( 'drag-complete' );
            activeCardClass.add( 'after' );

            afterCardClass.remove( 'after' );
            afterCardClass.add( 'before' );
        } else {
            console.log('problem with direction');
        }
    };

    /**
     * Add the correct class to the body, depending on if the drag was completed or not.
     */
    var _completeUpTransition = function( e ) {
        if ( e.distance < window.innerHeight / DRAG_WINDOW_FRACTION ) {
            bodyClass.add( 'dragup-reset' );
        } else {
            bodyClass.add( 'dragup-complete' );
            cardEls.active.classList.add( 'drag-complete' );
        }
    };

    var _completeDownTransition = function( e ) {
        if ( e.distance < window.innerHeight / DRAG_WINDOW_FRACTION ) {
            bodyClass.add( 'dragdown-reset' );
        } else {
            bodyClass.add( 'dragdown-complete' );
            cardEls.active.classList.add( 'drag-complete' );
        }
    };

    var _disableTouch = function( e ) {
        e.preventDefault();
    };

    return {
        init: init
    }

})();