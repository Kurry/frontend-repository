console.log("TALI")


jQuery(function($) {

    // console.log($('body').attr('class')); 
    
    function expandRelatedEventsDropdown(el) {
        $( el ).attr( "aria-expanded", "true" );
        $parent = $( el ).parents( ".event-popup-content" );
        $relatedDropdown = $parent.find('.related-events-dropdown');
        $relatedDropdownHeight = $parent.find('.related-events-ul').outerHeight(true);
        $parent.addClass( "expanded" );
        $relatedDropdown.css('max-height', $relatedDropdownHeight);
    }

    function collapseRelatedEventsDropdown(el) {
        $( el ).attr( "aria-expanded", "false" );
        $parent = $( el ).parents( ".event-popup-content" );
        $parent.removeClass( "expanded" );
        $relatedDropdown = $parent.find('.related-events-dropdown');
        $relatedDropdown.css('max-height', '0px');
    }

    $( document ).on( "click",'.related-events-dropdown-btn', e => {
        console.log($(e.currentTarget).attr( "aria-expanded" ));
        if ( $(e.currentTarget).attr( "aria-expanded" ) === "true" ) {
            collapseRelatedEventsDropdown( e.currentTarget );
        } else {
            expandRelatedEventsDropdown( e.currentTarget );
        }
    });


   

})