# 🚨 TROUBLESHOOTING: Minting Masih Failed

## Debug Process - Step by Step

Jika minting masih failed setelah implementasi universal access, ikuti langkah diagnosa ini:

### 🔍 **Step 1: Contract Verification**
Buka: `http://localhost:8082/debug` → Tab "Contract Verification"

1. **Run Contract Verification**
2. **Check Results:**
   - ✅ Contract addresses harus valid
   - ✅ Contract harus deployed (has bytecode)
   - ✅ Network harus Somnia Testnet (50312)
   - ✅ Read operations harus success

#### **Common Issues:**
- ❌ **Contract Not Deployed**: Address benar tapi contract tidak ada
- ❌ **Wrong Network**: User belum switch ke Somnia Testnet
- ❌ **RPC Connection Failed**: Masalah koneksi ke Somnia RPC

---

### 🔧 **Step 2: Parameter Analysis**
Tab "Parameter Analysis" → Run Parameter Diagnostic

1. **Parameter Validation:**
   - Address format: Must be valid 0x address
   - Royalty rate: Must be 0-10000 basis points
   - Duration: Must be > 0 seconds
   - Strings: Must not be empty

2. **Contract Call Test:**
   - Will attempt actual contract call
   - Shows exact error messages
   - Provides specific solutions

#### **Common Parameter Issues:**
- ❌ **Invalid Address**: Wrong format or empty address
- ❌ **Invalid Royalty**: Outside 0-10000 range
- ❌ **Empty Fields**: Required fields are empty
- ❌ **BigInt Conversion**: Number conversion errors

---

### ⚡ **Step 3: Factory Test**
Tab "Factory Test" → Test Factory Mint

1. **Check Factory Status:**
   - Contract connection
   - Fee reading
   - Direct mint capability

2. **Test Mint:**
   - Uses real parameters
   - Shows transaction hash
   - Confirms success/failure

---

## 🎯 **Most Common Issues & Solutions**

### 1. **Contract Address Issues**
```bash
# Check .env file
VITE_HIBEATS_FACTORY_ADDRESS=0x51760CfF0af7564f5E1BFaA675051DA7e36D36eA
```

**Solution:**
- Verify address in deployment files: `contracts/deployments/`
- Ensure address matches latest deployment
- Restart dev server after .env changes

### 2. **Network Connection Issues**
```bash
# Expected network
Chain ID: 50312
RPC: https://dream-rpc.somnia.network
```

**Solution:**
- Switch wallet to Somnia Testnet
- Check RPC endpoint is responding
- Try different RPC if available

### 3. **Insufficient Funds**
```bash
# Required balance
Mint Fee: ~0.001 STT
Gas Fee: ~0.005 STT
Total: ~0.006 STT minimum
```

**Solution:**
- Get STT tokens from Somnia faucet
- Check wallet balance
- Ensure enough for fee + gas

### 4. **Contract Paused**
```bash
# Check contract status
Contract Status: Active vs Paused
```

**Solution:**
- Contact contract owner to unpause
- Wait for contract to be reactivated
- Check official announcements

### 5. **Parameter Format Errors**
```bash
# Common format issues
Royalty Rate: Use basis points (500 = 5%)
Duration: Use seconds (30 = 30 seconds)
Address: Must start with 0x
```

**Solution:**
- Use parameter diagnostic tool
- Check exact parameter formats
- Validate all required fields

### 6. **ABI Mismatch**
```bash
# Function signature
directMint(address,string,string,string,string,uint256,string,bool,uint256,string,string,uint256)
```

**Solution:**
- Verify ABI matches deployed contract
- Check contract compilation
- Update ABI if contract changed

---

## 🛠 **Advanced Debugging**

### Console Debugging
1. Open browser DevTools (F12)
2. Check Console tab during minting
3. Look for error messages:

```javascript
// Look for these error patterns:
CALL_EXCEPTION: Contract call failed
NETWORK_ERROR: Connection issues
UNPREDICTABLE_GAS_LIMIT: Transaction will fail
User rejected: Transaction cancelled
```

### Network Debugging
```bash
# Test RPC connection manually
curl -X POST https://dream-rpc.somnia.network \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'

# Should return: {"jsonrpc":"2.0","id":1,"result":"0xc458"}
```

### Contract Debugging
```bash
# Check if contract exists
curl -X POST https://dream-rpc.somnia.network \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_getCode","params":["0x51760CfF0af7564f5E1BFaA675051DA7e36D36eA","latest"],"id":1}'

# Should return bytecode, not "0x"
```

---

## 📋 **Debugging Checklist**

### ✅ **Basic Checks**
- [ ] Wallet connected to Somnia Testnet (Chain ID: 50312)
- [ ] Sufficient STT balance (minimum 0.006 STT)
- [ ] Contract addresses in .env are correct
- [ ] Development server restarted after .env changes

### ✅ **Contract Verification**
- [ ] Factory contract address is valid
- [ ] Contract has bytecode (is deployed)
- [ ] Can read contract owner
- [ ] Can read direct mint fee
- [ ] Contract is not paused

### ✅ **Parameter Validation**
- [ ] All required fields are filled
- [ ] Address format is valid (0x...)
- [ ] Royalty rate is in valid range (0-10000)
- [ ] Duration is positive number
- [ ] Metadata URI is not empty

### ✅ **Network Connectivity**
- [ ] RPC endpoint is responding
- [ ] Latest block number is updating
- [ ] No network errors in console
- [ ] Wallet provider is working

---

## 🎯 **Quick Fixes**

### Fix 1: Reset Environment
```bash
# Delete .env and recreate
rm .env
# Copy content from SOLUSI_MINTING_LENGKAP.md
# Restart: npm run dev
```

### Fix 2: Clear Browser Cache
```bash
# Clear browser data
- Cache and cookies
- Local storage
- Restart browser
```

### Fix 3: Switch Network
```bash
# In wallet:
- Add Somnia Testnet manually
- Chain ID: 50312
- RPC: https://dream-rpc.somnia.network
- Currency: STT
```

### Fix 4: Check Latest Deployment
```bash
# Check contracts/deployments/ folder
# Use latest deployment file
# Update .env with latest addresses
```

---

## 🆘 **If Nothing Works**

### Last Resort Options:

1. **Use Different Wallet**
   - Try MetaMask vs WalletConnect
   - Different browser
   - Different device

2. **Check Contract Status**
   - Visit Somnia explorer
   - Verify contract exists
   - Check recent transactions

3. **Alternative RPC**
   - Try different RPC endpoint
   - Check Somnia documentation
   - Use backup RPC if available

4. **Contact Support**
   - Check contract deployment logs
   - Verify ABI compatibility
   - Contract may need redeployment

---

## 📊 **Expected Debug Results**

### ✅ **When Everything Works:**
```
Contract Verification: ✅ All checks pass
Parameter Analysis: ✅ All parameters valid
Factory Test: ✅ Mint succeeds
Console: No errors
Transaction: Hash returned successfully
```

### ❌ **Common Failed States:**
```
Contract Not Found: Check deployment
Network Wrong: Switch to Somnia
Insufficient Funds: Get more STT
Contract Paused: Wait for unpause
Invalid Parameters: Fix format issues
```

**Next Step**: Run debug tools in order: Verification → Parameters → Factory Test