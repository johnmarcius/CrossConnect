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
    function retrieveItemReceipts(requestParams) {
        
            var mySearch = search.load({
                id: 'customsearch_retrieve_item_receipts'//you will input the id of the saved search
            });

            var allIRArray = []

            mySearch.run().each(function(result) {
              var unitOfMeasure = result.getValue('unit');
              log.debug('unitOfMeasure',unitOfMeasure)
              var unitType = result.getValue({
               name: 'unitstype',
               join: 'item'
             })
             log.debug('unitType',unitType)

             if(unitType && unitOfMeasure){
              var unitsSearch = search.load({
                id: 'customsearch_units_search'//you will input the id of the saved search
               });
               var conversionRate;
  
               unitsSearch.filters.push(search.createFilter({
                name: 'internalid',
                operator: 'is',
                values: [unitType]
               }))
  
               unitsSearch.filters.push(search.createFilter({
                name: 'unitname',
                operator: 'is',
                values: [unitOfMeasure]
               }))
  
               unitsSearch.run().each(function(result) {
                var internalid = result.getValue({
                  name: 'internalid'
                })
                var unit = result.getValue({
                  name: 'unitname'
                })
                log.debug('internalid',internalid)
                log.debug('unit',unit)
                if(internalid == unitType && unit == unitOfMeasure){
                  conversionRate = result.getValue({
                    name: 'conversionrate'
                  })
                }
                
               })
  
               log.debug('conversionRate', conversionRate)
               var rateToUse;
               if(!conversionRate){
                rateToUse = result.getValue('fxrate')
               }else{
                rateToUse = result.getValue('fxrate') * conversionRate
               }
             }
              
 
              log.debug('rateToUse',rateToUse)

				irObj = {
                    shipzip: result.getValue('shipzip'),
                    createddate: result.getValue('datecreated'),
                    exchangerate: result.getValue('exchangerate'),
                    shipaddress: result.getValue({
                        name: 'name',
                        join: 'location'
                      }), //custcol_pol_account/name not in NetSuite
                    trandate: result.getValue('trandate'),
                    internalid: result.getValue('billaddress', 'billingAddress'),
                    name: result.getValue('internalid', 'billingAddress'),
                    employee: result.getValue('salesrep'),
                    internalid1: result.getValue('internalid', 'salesRep'),
                    name1: result.getValue('entityid', 'salesRep'),
                    billzip: result.getValue('billzip'),
                    shipaddressee: result.getText('terms'),
                    tobeprinted: result.getValue('tobeprinted'),
                    billcountry: result.getValue('billcountry'),
                    billingaddress: result.getValue('incoterm'),
                    recordtype: result.getValue('recordtype'),
                    currency: result.getValue('currency'),
                    internalid5: result.getValue('internalid', 'Currency'),
                    name5: result.getValue('name', 'Currency'), 
                    shipstate: result.getValue('shipstate'),
                    ns_internal_id: result.getValue('internalid'),
                    department: result.getValue('department'),
                    internalid6: result.getValue('internalid', 'department'),
                    name6: result.getValue('name', 'department'),
                    tobeemailed: result.getValue('tobeemailed'),
                    email: result.getValue('email'),
                    shipdate: result.getValue('shipdate'),
                    shippingaddress: result.getValue({
                        name: 'name',
                        join: 'location'
                      }),
                    zip1: result.getValue('zip', 'shippingAddress'),
                    country1: result.getValue('country', 'shippingAddress'),
                    //zip1: result.getValue('zip', 'billingAddress'),
                    //country1: result.getValue('country', 'billingAddress'),
                    addressee: result.getValue('memo'),
                    city: result.getValue('city', 'billingAddress'),
                    addr1: result.getValue('address1', 'billingAddress'),
                    state: result.getValue('state', 'billingAddress'),
                    override: result.getValue('override', 'billingAddress'),
                    tobefaxed: result.getValue('tobefaxed'),
                    total: result.getValue('total'),
                    shipcity: result.getValue('shipcity'),
                    recordtype: result.getValue('type'),
                    internalid6: result.getValue('department'),
                    shipdate: result.getValue('shipdate'),
                    custcol_line_no: result.getValue('custcol_line_no'),
                    name9: result.getText('item'),
                    quantity: result.getValue('quantity'),
                    rate: rateToUse,
                    internalid13: result.getValue('account'),
                    name13: result.getValue('type', 'account'),
                    billaddressee: result.getValue({
                        name: 'number',
                        join: 'vendor'
                      }),
                    //internalid15: result.getValue('account'),
                    name15: result.getValue({
                        name: 'name',
                        join: 'location'
                      }),
                    lineuniquekey: result.getValue('line'),
                    billingaddress_text: result.getValue({
                        name: 'email',
                        join: 'custbody_sik_requestor'
                      }),
                    tranid: result.getValue({
                      name: 'tranid',
                      join: 'createdFrom'
                    }),
                    closed: result.getValue('closed'),
                    name10: result.getValue('unit'),
                    isclosed_header: result.getValue('statusref'),
                    internalid6: result.getValue('department'),
                    internalid13: result.getValue('subsidiary'),
                    internalid15: result.getValue('location'),
                    internalid16: result.getValue({
                        name: 'number',
                        join: 'account'
                      }),
                    internalid14: result.getValue('custcol_cseg_sik_project'),
                    action: result.getValue('custbody_record_action')



                }
                log.debug('irObj', irObj)

                allIRArray.push(irObj)

				return true;
			});
            log.debug('allIRArray', allIRArray)
			return allIRArray;
                        
                    
    }

    return {
        'get': retrieveItemReceipts,
    };
    
});