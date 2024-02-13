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
    function retrieveBills(requestParams) {
        
            var mySearch = search.load({
                id: 'customsearch_retrieve_bills'//you will input the id of the saved search
            });

            var allBillArray = []
            var index = 1;
            mySearch.run().each(function(result) {
              
              var nameToUse = result.getText('item')
              
              if(!nameToUse){
                var nameToUse = result.getValue('memo')
              }

              var rate = result.getValue('fxrate');
              var quantity = result.getValue('quantity')
				billObj = {
                    internalid: result.getValue('internalid'),
                    tranid: result.getValue('transactionnumber'),
                    //suppliernumber: result.getValue('mainname'),
                    suppliernumber: result.getValue({
                      name: 'internalid',
                      join: 'vendor'
                    }),
                    status: result.getValue('statusref'),
                    currency: result.getText('currency'),
                    grosstotal: result.getValue('amount'),
                    trandate: result.getValue('trandate'),
                    terms: result.getText('terms'),
                    memomain: result.getValue('memomain'),
                    remittocode: result.getValue('location'),
                    requesteremail: result.getValue({
                      name: 'email',
                      join: 'custbody_requestor'
                    }),

                    linenumber: result.getValue('custcol_line_no'),
                    description: result.getValue('memo'),
                    price: result.getValue('fxrate'),
                    quantity: result.getValue('quantity'),
                    line_total: rate * quantity,
                    unitofmeasure: result.getValue('unit'),
                    subsidiary: result.getValue('subsidiary'),
                    account: result.getValue({
                      name: 'number',
                      join: 'account'
                    }),
                    department: result.getValue('department'),
                    class: result.getValue('class'),
                    accountfull: result.getValue('subsidiary') + '-' + result.getValue({
                      name: 'number',
                      join: 'account'
                    }) + '-' + result.getValue('department') + '-' + result.getValue('class') 
                    

                }
                log.debug('billObj', billObj)

                allBillArray.push(billObj)
            index++;
            if(index == 50){
              return false
            }
				return true;
			});
            log.debug('allBillArray', allBillArray)
			return allBillArray;
                        
                    
    }

    return {
        'get': retrieveBills,
    };
    
});