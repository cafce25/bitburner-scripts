let ns;
const fees = 100000;
const cycle = 4 * 1000;
// try to keep between frac.l and frac.h in cash
const frac = { l: 0.1, h: 0.2 };

async function waitForWseAPI() {
    while (true) {
        try {
            let sym = ns.getStockSymbols()[0];
            let vol = ns.getStockVolatility(sym);
            break;
        }
        catch (e) {
            ns.print("WSE not yet available");
            await ns.sleep(10 * cycle);
        }
    }
}
export async function main(ns_) {
    ns = ns_;
    ns.disableLog("ALL");
    
    await waitForWseAPI();
    
    while (true) {
        debugger;
        let stocks = getStocks();
        let cash = ns.getServerMoneyAvailable("home");
        let corpus = calculateCorpus(cash, stocks);
        // if we do not have above a certain amount of money, don't invest
        // also get rid of all stocks if we dont have the funds
        if (corpus < 9 * fees) {
            for (let stock of stocks) {
                sellShares(stock);
            }
            ns.print("not enough cash, sleeping...");
            await ns.sleep(10 * cycle);
            continue;
        }
        let i = 0, j = stocks.length - 1;
        
        while (i < stocks.length - 1 && stocks[i].maxShares == stocks[i].position.shares) ++i;
        while (j > 0 && (stocks[j].position.shares == 0 || stocks[j].expectedReturn <= 0)) {
            if (stocks[j].expectedReturn <= 0) {
                //sell all loosing shares
                let {shares, sellPrice} = sellShares(stocks[j]);
                if (shares > 0) {
                    corpus -= fees;
                    cash += shares * sellPrice - fees;
                }
            }
            --j;
        }
        while (stocks[i].expectedReturn > 0 && (i < j || corpus * frac.l > cash || corpus * frac.h < cash)) {
            if (i >= j) {
                if (corpus * frac.l > cash) {
                    //sell to get money
                    let needMoney = corpus * ((frac.l + frac.h) / 2) - cash;
                    let ridShares = Math.ceil((needMoney + fees) / stocks[j].bid);
                    let {shares, sellPrice} = sellShares(stocks[j], ridShares);
                    if (shares > 0) {
                        corpus -= fees;
                        cash += shares * sellPrice - fees;
                    }
                } else {
                    //Buy to invest money
                    let ridMoney = cash - corpus * ((frac.l + frac.h) / 2);
                    let wantShares = Math.ceil((ridMoney - fees) / stocks[i].ask);
                    let {shares, buyPrice} = buyShares(stocks[i], wantShares);
                    if (shares > 0) {
                        corpus -= fees;
                        cash -= fees + shares * buyPrice;
                    }
                }
            }
            else {
                let wantShares = stocks[i].maxShares - stocks[i].position.shares;
                let needMoney = corpus * frac.l + wantShares * stocks[i].ask + fees;
                if (cash >= needMoney) {
                    let {shares, buyPrice} = buyShares(stocks[i]);
                    if (shares > 0) {
                        corpus -= fees;
                        cash -= shares * buyPrice + fees;
                    }
                }
                else {
                    //sell underperfroming shares
                    let {shares, sellPrice} = sellShares(stocks[j]);
                    if (shares > 0) {
                        corpus -= fees;
                        cash += shares * sellPrice - fees;
                    }
                }
            }
            while (i < stocks.length - 1 && stocks[i].maxShares == stocks[i].position.shares) ++i;
            while (j > 0 && stocks[j].position.shares == 0) --j;
        }
        await ns.sleep(cycle); //TODO sleep only for 4s if we are on fast time still;
    }
}

function sellShares(stock, shares = null) {
    if (shares == null) shares = stock.position.shares;
    shares = Math.min(shares, stock.position.shares);
    if (shares <= 0) return {shares: 0, sellPrice: 0};
    let sellPrice = ns.sellStock(stock.sym, shares);
    let profit = shares * (sellPrice - stock.position.avgPx) - fees;
    stock.position.shares -= shares;
    ns.print(`Sold ${ns.nFormat(shares, "0.000a")} ` +
             `shares of ${stock.sym} ` +
             `for ${ns.nFormat(sellPrice, "$0.000a")} each ` +
             `${profit > 0?"making":"loosing"} ${ns.nFormat(profit>0?profit:-profit, "$0.000a")}`);
    return {shares, sellPrice};
}

function buyShares(stock, shares = null) {
    if (shares == null) shares = stock.maxShares - stock.position.shares;
    shares = Math.min(shares, stock.maxShares - stock.position.shares);
    if (shares <= 0) return {shares: 0, buyPrice: 0};
    let buyPrice = ns.buyStock(stock.sym, shares);
    stock.position.shares += shares;
    ns.print(`Bought ${ns.nFormat(shares, "0.000a")} ` +
             `shares of ${stock.sym} ` +
             `for ${ns.nFormat(buyPrice, "$0.000a")} each`);
    return {shares, buyPrice};
}

function getStocks(stocks = []) {
    /*if (stocks == []) {
        for (let sym of ns.getStockSymbols()) {
            stocks.push({
                sym: sym,
                maxShares: ns.getStockMaxShares(sym),
            });
        }
    }*/
    //for (let stock of stocks) {
    for (let sym of ns.getStockSymbols()) {
        let stock = {sym:sym};
        //let sym = stock.sym;
        //stock.price = ns.getStockPrice(sym);
        stock.ask = ns.getStockAskPrice(sym);
        stock.bid = ns.getStockBidPrice(sym);
        stock.position = {};
        [
            stock.position.shares,
            stock.position.avgPx,
            stock.position.short,
            stock.position.avgShortPx
        ] = ns.getStockPosition(sym);
        stock.maxShares = ns.getStockMaxShares(sym);
        stock.volatility = ns.getStockVolatility(sym);
        stock.forecast = 2 * (ns.getStockForecast(sym) - 0.5);
        stock.expectedReturn = stock.volatility * stock.forecast;
        
        stocks.push(stock);
    }
    stocks.sort((a, b) => b.expectedReturn - a.expectedReturn);
    return stocks;
}

function calculateCorpus(cash, stocks) {
    let corpus = cash;
    for (let stock of stocks) {
        corpus +=
            ns.getStockSaleGain(stock.sym, stock.position.shares, "L") +
            ns.getStockSaleGain(stock.sym, stock.position.short, "S");
    }
    return corpus;
}