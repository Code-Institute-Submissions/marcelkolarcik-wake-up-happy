/*GETTING LOCATION DETAILS ON owner.html WHEN USER ADDING OR EDITING
 * ROOM
 *
 * USING nominatim.openstreetmap.org/reverse API
 *
 * */

import { translate } from "../shared/translator/translator.js";


( function ()
	{
		
		/*INITIAL COORDINATES OF THE MAP WITH ZOOM 6 */
		var mymap = L.map ( 'map_owner' ).setView ( [ 53.505, -8.49 ], 6 );
		
		L.tileLayer ( 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			maxZoom     : 18,
			attribution : 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
			              '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
			              'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
			id          : 'mapbox/streets-v11'
		} ).addTo ( mymap );
		
		var popup = L.popup ( {
			                      /*CUSTOM CLASS FOR POPUP*/
			                      className : 'popup_class'
			
		                      } );
		
		mymap.on ( 'click', getCoordinates );

//WHEN USER CLICKS ON THE MAP WHEN SELECTING THE LOCATION OF THE PROPERTY ON owner.html
// POPUP WILL SHOW WITH COORDINATES AND get_address BUTTON*/
		
		function getCoordinates ( e )
			{

//		    by clicking on map  59 characters are added to description text area, so this is to clear it
//			NOT QUITE SURE WHY.... BUT I REALIZED, THAT THIS WAS CREATING THE ADDITIONAL CHARS,]
//			SO I'M REMOVING IT HERE
				$ ( '#room_description' ).html ( '' );
				
				/*IF USER IS RE-SELECTING LOCATION OF THE PROPERTY,
				 * WE WILL CLEAR PREVIOUSLY SELECTED LOCATION DETAILS*/
				$ ( '#location_details' ).html ( '' );
				
				var coordinates = e.latlng.toString ()
				                   .replace ( 'LatLng(', '' )
				                   .replace ( ')', '' )
				                   .replace ( ' ', '' )
				                   .split ( ',' );
				
				popup
					.setLatLng ( e.latlng )
					.setContent ( ` <i class = "fas fa-map-marker-alt" >  ${ coordinates[ 0 ] } , ${ coordinates[ 0 ] }
					              <br><button type="submit" id="get_address"
										class="bg_orange  btn btn-sm p-0 float-right ___"
										data-title="click to get location details"
										data-text="get details"
										data-cy="get_details"></button>` )
					.openOn ( mymap );
				
				translate ();
				/*USING nominatim API FROM openstreetmap TO DO REVERSE SEARCH AND
				 *WHEN USER CLICKS ON get details WE'LL
				 * TAKE THE this.responseText AND TAKE address   FROM IT
				 * TO DISPLAY LOCATION DETAILS TO OWNER WITH
				 * render_location_details() FUNCTION*/
				
				var url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${ coordinates[ 0 ] }&lon=${ coordinates[ 1 ] }`;
				
				$ ( '#get_address' ).removeClass ( 'd-none' ).on ( 'click', function ()
				{
					
					getAddress ( url, coordinates );
					
					swal.fire ( {
						            html              : `<img src="assets/src/images/loader.gif" alt="loader">`,
						            showConfirmButton : false,
						            position          : 'top',
						            width             : 100
					            } );
					
					/*ON MOBILE DEVICES USER WOULDN'T SEE ADDRESS DIV , WHERE HE NEEDS TO INPUT PROPERTY NAME
					 * SO TO MAKE IT EASIER WE WILL SCROLL TO THAT DIV*/
					$ ( '#location_details' ).get ( 0 ).scrollIntoView ();

//				TO PREVENT PAGE FROM RELOADING AND CLEARING LOCATION DETAILS FROM THE FORM
					
					return false;
					
				} );
				
				
			}
		
		
		/*GETTING ADDRESS DETAILS FORM nominatim.openstreetmap.org/reverse API */
		function getAddress ( url, coordinates )
			{
				
				var location_details = $ ( '#location' );
				var xhr              = new XMLHttpRequest ();
				
				xhr.onreadystatechange = function ()
					{
						if ( this.readyState === 4 && this.status === 200 )
							{
								/*TO CLEAR INITIAL HOW TO DESCRIPTION WHICH DISPLAYS
								 * NEXT TO THE MAP ON INITIAL LOAD OF owner.html*/
								location_details.html ( '' );
								
								/*TO HIDE get_address, BECAUSE USER ALREADY GOT DETAILS FORM API
								 * TO PREVENT MULTIPLE CLICKS FOR THE SAME LOCATION
								 *
								 * THERE IS ALSO LIMIT OF MAX 1 REQUEST PER SECOND FROM
								 * nominatim.openstreetmap.org/reverse API AT THE MOMENT*/
								$ ( '#get_address' ).addClass ( 'd-none' );
								
								var address_data = JSON.parse ( this.responseText ).address;
								
								render_location_details ( address_data, coordinates );
								
								/*CLOSING LOADER GIF ALERT*/
								swal.close ();
							}
						
					};
				
				xhr.open ( "GET", url );
				xhr.send ();
				
				/*THERE IS ERR_CONNECTION_TIMED_OUT HAPPENING SOMETIMES,
				 * SO WE WILL NOTIFY USER TO TRY AGAIN LATER */
				xhr.onerror = function ()
					{
						swal.fire ( {
							            html               : `<h4>Server error!</h4>
																<hr class="bg-danger">
																<code>net::ERR_CONNECTION_TIMED_OUT</code>
																<hr class="bg-danger">
																<p>Please try again later!</p>`,
							            showConfirmButton  : true,
							            confirmButtonColor : '#0fbeba',
							
							            confirmButtonText : `<i class="fas fa-check-circle"></i>`
						            } );
					};
				
			}
		
	} ) ();

// IF OWNER IS LOGGED IN INTO HIS ACCOUNT AND HAS AT LEAST ONE ROOM
// AND IS EDITING OR PREVIEWING ROOM, WE WILL POPULATE HIS ADDRESS
//DETAILS FROM THIS ROOM
$ ( function ()
    {
	    if (
		    sessionStorage.room_to_edit &&
		    !sessionStorage.add_mode &&
		    sessionStorage.authorized_owner )
		    {
			
			    var coordinates = [];
			    var room        = JSON.parse ( sessionStorage.getItem ( 'room_to_edit' ) );
			
			    /*DATA TO RENDER LOCATION  DETAILS OF THE ROOM*/
			    var address_data = room.p_address;
			    coordinates[ 0 ] = room.lat;
			    coordinates[ 1 ] = room.lng;
			
			    render_location_details ( address_data, coordinates, true );
		    }
    } );


/*APPENDING ADDRESS DETAILS TO THE FORM
 * WE MAKE COUNTRY, COUNTRY CODE , LAT, LNG READ ONLY
 * ALL OTHER INPUT FIELDS ARE EDITABLE BY USER*/
function render_location_details ( address_data, coordinates, owner = false )
	{
		var location = $ ( '#location' );
		
		location.append ( `${ owner ? '' : `<div class = "col" >
            <label class = "sr-only ___" for = "property_name" data-text="Property Name"></label >
            <div class = "input-group mb-2" >
                <div class = "input-group-prepend" >
                    <div class = "input-group-text bg-transparent border_bottom_only" >
                     <i class="fas fa-signature"></i>
                    </div >
                </div >
                <input type = "text" name = "address__property_name"
                       class = "form-control form-control-sm  border-danger ___ green_dark"
                       id = "property_name" data-placeholder = "Property Name"
                       data-cy="property_name"
                        value="${ typeof ( address_data.property_name ) !== "undefined" ? address_data.property_name
		                                                                                : '' }" required >
            </div >` }
					` );
		$.each ( address_data, function ( key, value )
		{
			
			location.append ( `
					 <div class = "col-auto " >
                    <label class = "sr-only" for = "${ key }" >${ key }</label >
                    <div class = "input-group mb-2 d-flex align-items-center" >
                        <div class = "input-group-prepend" >
                            <div class = "input-group-text bg-transparent no_border green_dark" >
                            ${ key === 'property_name' ? ` <i class="fas fa-signature"></i>` :
			                   ` <strong class = " ___" data-text="${ key.replace (
				                   '_', ' ' ) }" ></strong >` }
                            
                            </div >
                        </div >
                        <input type = "text" name = "address__${ key }"
                               class = "form-control form-control-sm border_bottom_only green_dark"
                               id = "	${ key }" value="${ value }" required
										${ key !== 'country' ? '' : 'readonly' }
										${ key !== 'country_code' ? '' : 'readonly' }  >
                    </div >
                </div >
					` );
		} );
		location.append ( `
					 <div class = "col-auto " >
                    <label class = "sr-only" for = "lat" >lat</label >
                    <div class = "input-group mb-2" >
                        <div class = "input-group-prepend" >
                            <div class = "input-group-text bg-transparent border_bottom_only" >
                                <i class = "fas fa-map-marker-alt green_dark" >&nbsp;lat</i >
                            </div >
                        </div >
                        <input type = "text" name = "lat"
                               class = "form-control form-control-sm border_bottom_only green_dark"
                               id = "lat" value="${ coordinates[ 0 ] }" required  readonly>
                    </div >
                </div >
					` );
		location.append ( `
					 <div class = "col-auto " >
                    <label class = "sr-only" for = "lng" >lng</label >
                    <div class = "input-group mb-2" >
                        <div class = "input-group-prepend" >
                            <div class = "input-group-text bg-transparent border_bottom_only" >
                                <i class = "fas fa-map-marker-alt green_dark" >&nbsp;lng</i >
                            </div >
                        </div >
                        <input type = "text" name = "lng"
                               class = "form-control form-control-sm border_bottom_only green_dark"
                               id = "lng" value="${ coordinates[ 1 ] }" required readonly >
                    </div >
                </div >
                
            
        </div >
					` );
		translate ();
		
		
	}



