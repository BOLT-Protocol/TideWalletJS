const ethereumService = require('../../src/services/ethereumService');
const packageName = require('../../src/helpers/httpAgent');

test('getReceivingAddress & ', async () => {
  {
    const receive_currency_id = '2ac86633-3d3c-4d23-86e9-e22aab128eb1'
    const address = '0x048Cacc922C027f2eC13C56C1609c8A5684D1927'

    // mock service
    const service = {}
    // mock http response
    const communicator = {
      accountReceive: () => ({
        address
      }),
    }
    // mock db
    const _DBOperator = {}
    const _ethService = new ethereumService(service, communicator, _DBOperator);


    const result = await _ethService.getReceivingAddress(receive_currency_id)
    expect(result[0]).toBe(address);
    expect(_ethService._address).toBe(address);
  }
})

test('getReceivingAddress', async () => {
  {
    const receive_currency_id = '2ac86633-3d3c-4d23-86e9-e22aab128eb1'
    const address = '0x048Cacc922C027f2eC13C56C1609c8A5684D1927'

    // mock service
    const service = {}
    // mock http response
    const communicator = {
      accountReceive: () => ({
        address
      }),
    }
    // mock db
    const _DBOperator = {}
    const _ethService = new ethereumService(service, communicator, _DBOperator);

    const result = await _ethService.getChangingAddress(receive_currency_id)
    expect(result[0]).toBe(address);
    expect(_ethService._address).toBe(address);
  }
})

test('getTransactionFee', async () => {
  {
    // mock service
    const service = {}
    // mock http response
    const communicator = {
      getFee: () => ({
        slow: '100',
        standard: '100',
        fast: '100'
      }),
    }
    // mock db
    const _DBOperator = {}
    const _ethService = new ethereumService(service, communicator, _DBOperator);

    const result = await _ethService.getTransactionFee('80000CFC')
    expect(result.slow).toBe('100');
  }
})

test('publishTransaction', async () => {
  {
    // mock service
    const service = {}
    // mock http response
    const communicator = {
      getFee: () => ({
        slow: '100',
        standard: '100',
        fast: '100'
      }),
    }
    // mock db
    const _DBOperator = {}
    const _ethService = new ethereumService(service, communicator, _DBOperator);

    const result = await _ethService.getTransactionFee('80000CFC')
    expect(result.slow).toBe('100');
  }
})

test('publishTransaction', async () => {
  {
    const txid = '0xe617867c5e09f3eb26fc9511f1be689534a53e77cedca8b488076c5ef37bd18e'

    // mock service
    const service = {}
    // mock http response
    const communicator = {
      publishTransaction: () => ({
        txid
      }),
    }
    // mock db
    const _DBOperator = {}
    const _ethService = new ethereumService(service, communicator, _DBOperator);

    const result = await _ethService.publishTransaction('80001F51', { serializeTransaction: '0xf86a80843b9aca0080948c14f0fb37dd08b0f302fd568f401ba47376a81c87038d7ea4c6800080823ec5a001e81fecf9eb9f3da2a307b9723a8c83c8cd26452f62d89d6ea742f205044958a009b223f68f7caf1e805484a4d179fcc5e42855da6fb8a297cd654e0c86f836a9' })
    expect(result[0]).toBeTruthy()
    expect(result[1].txId).toBe(txid);
  }
})

test('addToken', async () => {
  {
    const token_id = '488c3047-ced5-4049-9967-8ececb41ced1'

    // mock service
    const service = {
      accountId: '8a8a54b4-9c03-4daa-944c-05bc0186f33a',
      AccountCore: () => ({
        currencies: {},
        messenger: {
          next: () => {}
        },
      })
    }
    // mock http response
    const communicator = {
      tokenRegist: () => ({
        token_id
      }),
      accountDetail: () => ({
        blockchain_id: '8000003C',
        currency_id: '5b755dacd5dd99000b3d92b2',
        account_id: 'da46ff0c-ae3c-47eb-a547-ad4b45f9a527',
        purpose: 3324,
        account_index: '0',
        curve_type: 0,
        balance: '0',
        symbol: 'ETH',
        icon: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@9ab8d6934b83a4aa8ae5e8711609a70ca0ab1b2b/32/icon/eth.png',
        tokens: [
            {
                account_token_id: 'cfbb77d5-48e6-48ba-98cf-7a35e8f7faa9',
                token_id: '5c00093e1e24e600214f0837',
                blockchain_id: '8000003C',
                name: 'Wrapped Bitcoin',
                symbol: 'WBTC',
                type: 2,
                publish: true,
                decimals: 2,
                total_supply: '0',
                contract: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
                balance: '0'
            },
            {
                account_token_id: '388e9567-1669-4d5f-9be2-7258bb6c0ec5',
                token_id: '5b1ea92e584bf50020130b28',
                blockchain_id: '8000003C',
                name: 'Dai',
                symbol: 'DAI',
                type: 2,
                publish: true,
                decimals: 2,
                total_supply: '0',
                contract: '0x6b175474e89094c44da98b954eedeac495271d0f',
                balance: '0'
            }
          ]
      })
    }
    // mock db
    const _DBOperator = {
      currencyDao: {
        insertCurrency: () => {},
        entity: () => {}
      },
      accountCurrencyDao: {
        insertAccount: () => {},
        entity: () => {},
        findJoinedByAccountId: () => {}
      }
    }
    const _ethService = new ethereumService(service, communicator, _DBOperator);

    const result = await _ethService.addToken('80001F51', { serializeTransaction: '0xf86a80843b9aca0080948c14f0fb37dd08b0f302fd568f401ba47376a81c87038d7ea4c6800080823ec5a001e81fecf9eb9f3da2a307b9723a8c83c8cd26452f62d89d6ea742f205044958a009b223f68f7caf1e805484a4d179fcc5e42855da6fb8a297cd654e0c86f836a9' })
    expect(result).toBeTruthy()
  }
})

test('estimateGasLimit', async () => {
  {
    // mock service
    const service = {}
    // mock http response
    const communicator = {
      getGasLimit: () => ({
        gasLimit: "1000000"
      }),
    }
    // mock db
    const _DBOperator = {}
    const _ethService = new ethereumService(service, communicator, _DBOperator);

    const result = await _ethService.estimateGasLimit('80000CFC', '0x7857af2143cb06ddc1dab5d7844c9402e89717cb', '0xc595B20EEC3d35E8f993d79262669F3ADb6328f7', '0x', '0x')
    expect(result).toBe(1000000);
    expect(_ethService._gasLimit).toBe(1000000);
  }
})

test('getNonce', async () => {
  {
    // mock service
    const service = {}
    // mock http response
    const communicator = {
      getNonce: () => ({
        nonce: '20'
      }),
    }
    // mock db
    const _DBOperator = {}
    const _ethService = new ethereumService(service, communicator, _DBOperator);

    const result = await _ethService.getNonce('80000CFC', '0x7857af2143cb06ddc1dab5d7844c9402e89717cb')
    expect(result).toBe(20);
  }
})
