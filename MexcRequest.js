// dependencies
const axios = require('axios');
const qs = require('qs');
let crypto = require('crypto');


const key = "";
const secret = "";

const exchangesConfiguration = {
    'mexc' : {
        sandboxMode: false,
        api: {
            spot: {
                endpoint: 'https://www.mexc.com/open/api/v2',
            },
            contract: {
                endpoint: 'https://contract.mexc.com/api/v1/contract/'
            }
        },
    }
}


const signRequest = (host, path, method = 'GET', data = {},  params = {}, headers = undefined, body = undefined) => {
    let auth = '', url = '';

    url = host + '/' + path;

    if (!params.hasOwnProperty('auth')) {
        if(Object.keys(data).length !== 0) {
            url += '?' + qs.stringify(data);
        }
    } else {
        const timestamp = new Date().getTime();
        headers = {
            'ApiKey': params.cexData.key,
            'Request-Time': timestamp,
            'Content-Type': 'application/json',
        };
                
        if (method === 'POST') {
            if(Object.keys(data).length !== 0) {
                auth = JSON.stringify(data);
            }

            body = auth;

        } else {
            if (Object.keys(data).length) {
                auth += qs.stringify(data);
                url += '?' + auth;
            }
        }

        auth = params.cexData.key + timestamp + auth;

        const signature = crypto.createHmac('sha256', params.cexData.secret).update(auth).digest('hex');
        headers['Signature'] = signature;
    }
    return { 'url': url, 'method': method, 'data': body, 'headers': headers };
}

class MexcRequest {

    // to connect to binance api
    request = async(data, params = {}) => {
        //API mode
        const exchangeId = 'mexc';
        const validMarketTypes = ['spot', 'contract'];
        const validMethods = ['GET', 'POST', 'DELETE'];

        const marketType = params.marketType !== null ? (params.marketType).toLowerCase() : undefined;
        const method = params.method !== null ? (params.method).toUpperCase() : undefined;
        const endPoint = ((params.endPoint !== null) || (params.endPoint !== '')) ? params.endPoint : undefined;

        if(params.hasOwnProperty('marketType')){
            if(!validMarketTypes.includes(marketType)){
                throw "Invalid market type";
            }
        } else {
            throw "param market type required.";
        }

        if(params.hasOwnProperty('method')){
            if(!validMethods.includes(method)){
                throw "Invalid request method passed";
            }
        } else {
            throw "request method is required.";
        }

        if(endPoint === undefined){
            throw "param endPoint is required.";
        }

        if(method === 'POST' || (params.hasOwnProperty('auth') && params.auth === true)){
            if(!(params.hasOwnProperty('cexData') && params.cexData.hasOwnProperty('key'))){
                throw "post request must call by swap provider cex key.";
            }
            if(!(params.hasOwnProperty('cexData') && params.cexData.hasOwnProperty('secret'))){
                throw "post request must call by swap provider cex secret key.";
            }
        }


        const exchangeConfig = exchangesConfiguration[exchangeId].api[marketType];
        const host = exchangeConfig.endpoint;

        try {
            const requestParams = signRequest(host, endPoint, method, data, params);
            console.log(requestParams);
            const response = await axios(requestParams);

            if(response.status == 200){
                return response.data;
            } else {
                console.error({
                    status: response.status
                });
                return undefined;
            }
        } catch (err) {
            if(err.hasOwnProperty('response')){
                console.error({
                    status: err.response.status,
                    code: err.response.data.code,
                    message: err.response.data.msg
                });
            } else {
                console.log(err);                
            }
            return undefined;
        }
    }

    fetchTickers = async(symbol) => {
        symbol = symbol.replace('/', '_');
        const response = await this.request({
            'symbol': symbol
        }, {
            'method': 'GET',
            'endPoint': 'market/ticker',
            'marketType': 'SPOT'
        });

        if(response){
            return response.data;
        } else {
            return undefined;
        }
    }

    currencyInfo = async(currency) => {
        const response = await this.request({
            currency: currency
        }, {
            'method': 'GET',
            'endPoint': 'market/coin/list',
            'marketType': 'SPOT'
        });
        client_order_id
        if(response){
            return response.data;
        } else {
            return undefined;
        }
        
    }

    accInfo = async(
        query = {},
        authParams = {key,secret}        
    ) => {
        const response = await this.request({}, {
            'method': 'GET',
            'endPoint': 'account/info',
            'marketType': 'SPOT',
            'auth': true,
            'cexData': {
                key: authParams.key,
                secret: authParams.secret
            }
        });

        if(response){
            return response.data;
        } else {
            return undefined;
        }
    }

    // Obtain the trading pairs of the accounts that can trade through the API
    getTradingPairs = async(
        query = {},
        authParams = {key,secret}
    ) => {
        const response = await this.request({}, {
            'method': 'POST',
            'endPoint': 'market/api_symbols',
            'marketType': 'SPOT',
            'auth': true,
            'cexData': {
                key: authParams.key,
                secret: authParams.secret
            }           
        });

        if(response){
            return response.data;
        } else {
            return undefined;
        }           
    }

    placeOrder = async(
        query = { symbol, price, quantity, trade_type, order_type, client_order_id},
        authParams = {key,secret}
    ) => {
        const symbol = query.symbol.replace('/', '_');
        const price = query.price;
        const quantity = query.quantity;        
        let trade_type = query.trade_type.toUpperCase().trim();
        const order_type = query.order_type.toUpperCase().trim();
        const client_order_id = query.client_order_id;
        const validTradeTypes = ['BID', 'ASK', 'BUY', 'SELL'];
        const tradeTypeAlias = ['BUY', 'SELL'];
        const tradeTypeAliasMap = {
            'BUY': 'BID',
            'SELL': 'ASK'
        };
        
        const validOrderTypes = ["LIMIT_ORDER", "POST_ONLY", "IMMEDIATE_OR_CANCEL"];
            
        if(symbol === null || symbol === '' || symbol === undefined){
            throw 'parameter symbol is required.';            
        }
        
        if(price === null || price === '' || price === undefined){
            throw 'parameter price is required.';            
        }
        
        if(quantity === null || quantity === '' || quantity === undefined){
            throw 'parameter quantity is required.';            
        }

        if(trade_type === null || trade_type === '' || trade_type === undefined){
            throw 'parameter trade_type is required.';            
        }        
        
        if(order_type === null || order_type === '' || order_type === undefined){
            throw 'parameter order_type is required.';            
        }
        
        
        if(!validTradeTypes.includes(trade_type)){
            throw 'Invalid trade type passed.';
        }
        
        if(tradeTypeAlias.includes(trade_type)){
            trade_type = tradeTypeAliasMap[trade_type];
        }
        
        if(!validOrderTypes.includes(order_type)){
            throw 'Invalid order type passed.';
        }
        
        let args = {
            symbol: symbol,
            price: price,
            quantity: quantity,
            trade_type: trade_type,
            order_type: order_type
        };
        
        if(client_order_id !== undefined && client_order_id.length > 0){
            client_order_id = client_order_id.length > 32 ? client_order_id.substring(0, 32) : client_order_id;
            args['client_order_id'] = client_order_id;
        }

        const response = await this.request(args, {
            'method': 'POST',
            'endPoint': 'order/place',
            'marketType': 'SPOT',
            'auth': true,
            'cexData': {
                key: authParams.key,
                secret: authParams.secret
            }
        });

        if(response){
            return response.data;
        } else {
            return undefined;
        }
    }

    queryOrder = async(
        query = {order_ids},
        authParams = {key,secret}
    ) => {
        const response = await this.request({
            order_ids: query.order_ids
        }, {
            'method': 'GET',
            'endPoint': 'order/query',
            'marketType': 'SPOT',
            'auth': true,
            'cexData': {
                key: authParams.key,
                secret: authParams.secret
            }           
        });

        if(response){
            return response.data;
        } else {
            return undefined;
        }
    }

    // cancel order
    cancelOrder = async(
        query = {order_ids, client_order_ids}, 
        authParams = {key,secret}
    ) => {

        if(query.hasOwnProperty('order_ids') && query.order_ids.length > 0){
            delete query['client_order_ids'];
        }

        const response = await this.request({
            order_ids: query.order_ids,
            client_order_ids: query.client_order_ids
        }, {
            'method': 'DELETE',
            'endPoint': 'order/cancel',
            'marketType': 'SPOT',
            'auth': true,
            'cexData': {
                key: authParams.key,
                secret: authParams.secret
            }           
        });

        if(response){
            return response.data;
        } else {
            return undefined;
        }
    }

    queryDepositsRecords = async(
        query = { currency, state, start_time, end_time, page_num, page_size}, 
        authParams = { key, secret}
    ) => {
        const response = await this.request({
            currency: query.currency,
            state: query.state,
            start_time: query.start_time,
            end_time: query.end_time,
            page_num: query.page_num,
            page_size: query.page_size
        }, {
            'method': 'GET',
            'endPoint': 'asset/deposit/list',
            'marketType': 'SPOT',
            'auth': true,
            'cexData': {
                key: authParams.key,
                secret: authParams.secret
            }           
        });

        if(response){
            return response.data;
        } else {
            return undefined;
        }
    }
    
    placeWithdrawOrder = async(
        query = {currency, chain, amount, address, remark},
        authParams = { key, secret}
    ) => {

        let args = {
            currency: query.currency,
            chain: query.chain,
            amount: query.amount,
            address: query.address,
        }

        if(query.remark !== undefined && query.remark.length > 0){
            args['remark'] = query.remark
        }


        const response = await this.request(args, {
            'method': 'POST',
            'endPoint': 'asset/withdraw',
            'marketType': 'SPOT',
            'auth': true,
            'cexData': {
                key: authParams.key,
                secret: authParams.secret
            }           
        });

        if(response){
            return response;
        } else {
            return undefined;
        }
    }

    queryWithdrawRecords = async(
        query = { currency, withdraw_id, state, start_time, end_time, page_num, page_size}, 
        authParams = { key, secret}
    ) => {
        const response = await this.request({
            currency: query.currency,
            withdraw_id: query.withdraw_id,
            state: query.state,
            start_time: query.start_time,
            end_time: query.end_time,
            page_num: query.page_num,
            page_size: query.page_size
        }, {
            'method': 'GET',
            'endPoint': 'asset/withdraw/list',
            'marketType': 'SPOT',
            'auth': true,
            'cexData': {
                key: authParams.key,
                secret: authParams.secret
            }           
        });

        if(response){
            return response.data;
        } else {
            return undefined;
        }
    }


}


(async () => {
    let response = null;
    let exchangeInstance = new MexcRequest();
    //response = await exchangeInstance.fetchTickers('ETH/USDT');

    //response = await exchangeInstance.currencyInfo('BNB');

    // response = await exchangeInstance.accInfo({}, {
    //     key: key,
    //     secret: secret
    // });

    // response = await exchangeInstance.getTradingPairs({}, {
    //     key: key,
    //     secret: secret
    // });

    // response = await exchangeInstance.queryOrder({
    //     order_ids: 1234
    // }, {
    //     key: key,
    //     secret: secret
    // });

    // response = await exchangeInstance.cancelOrder({
    //     order_ids: 12313,
    //    // client_order_ids: 'ABCD'
    // }, {
    //     key: key,
    //     secret: secret
    // });

    // response = await exchangeInstance.placeOrder({
    //     symbol: 'BNB_USDT',
    //     price: '400.00',
    //     quantity: '0.009',
    //     trade_type: 'ASK',
    //     order_type: 'LIMIT_ORDER'        
    // }, {
    //     key: key,
    //     secret: secret
    // });


    // response = await exchangeInstance.queryDepositsRecords({
    //     //currency: 'ETH-BSC'
    // }, {
    //     key: key,
    //     secret: secret
    // });


    // response = await exchangeInstance.queryWithdrawRecords({
    //     //currency: 'ETH-BSC'
    // }, {
    //     key: key,
    //     secret: secret
    // });

    // response = await exchangeInstance.placeWithdrawOrder({
    //     currency: 'BNB',
    //     chain: 'BEP20(BSC)',
    //     amount: '0.0000009',
    //     address: "asdadasdsadsad",
    //     //remark: 'testing'
    // }, {
    //     key: key,
    //     secret: secret
    // });


    console.log(response);
})();


module.exports = {
    MexcRequest
};