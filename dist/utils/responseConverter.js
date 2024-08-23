"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertResponse = convertResponse;
function convertResponse(symbolConversion, response, symbolsFields = ["coin", "symbol"], symbolMode = "") {
    return symbolConversion.convertSymbolsInObject(response, symbolsFields, symbolMode);
}
//# sourceMappingURL=responseConverter.js.map