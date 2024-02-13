/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 */
define(['N/search','N/record'],

function(search,record) {
   
    /**
     * Function called upon sending a GET request to the RESTlet.
     *
     * @param {Object} requestParams - Parameters from HTTP request URL; parameters will be passed into function as an Object (for all supported content types)
     * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
     * @since 2015.1
     */
    function retrieveITems(requestParams) {
        
            var mySearch = search.load({
                id: 'customsearch_retrieve_items'//you will input the id of the saved search
            });

            var allItemArray = []
            
            mySearch.run().each(function(result) {
                var baseUnit;
                var unitstype = result.getText('unitstype');
                
                if(unitstype == 'Each'){
                    baseUnit = 'Ea'
                }else if(unitstype == 'Inch'){
                    baseUnit = 'In'
                }else if(unitstype == 'Gallon'){
                    baseUnit = 'GAL'
                }else{
                    baseUnit = 'UNK'
                }

				itemObj = {
                    internalid: result.getValue('internalid'),
                    itemid: result.getValue('itemid'),
                    displayname: result.getValue('displayname'),
                    salesdescription: result.getValue('salesdescription'),
                    type: result.getValue('type'),
                    puchasedescription: result.getValue('puchasedescription'), //custcol_pol_account/name not in NetSuite
                    isinactive: result.getValue('isinactive'),
                    mpn: result.getValue('mpn'),
                    othervendor: result.getValue('othervendor'),
                    vendorpricecurrrency: result.getValue('vendorpricecurrrency'),
                    preferredvendor: result.getValue('vendor'),
                    //vendorcode: result.getValue('vendorcode'),
                    vendorcode: result.getValue({
                        name: 'internalid',
                        join: 'vendor'
                      }),
                    vendorcostentered: result.getValue('vendorcostentered'),
                    unitstype: baseUnit,
                }
                log.debug('itemObj', itemObj)
                
                allItemArray.push(itemObj)

				return true;
			});
            log.debug('allItemArray', allItemArray)
			return allItemArray;
                        
                    
    }

    return {
        'get': retrieveITems,
    };
    
});