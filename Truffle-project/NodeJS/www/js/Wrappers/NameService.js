class NameService {

    constructor(nsAddress, provider, name) {
        this.address = nsAddress;
        this.provider = provider;
        this.name = name;
        var ns = this;

        $.getJSON(myABI_PROVIDER_EtherTrackNS, function (data) {
            console.log("Parsing ABI done. (NameService)");

            ns.abi = data;

            if (ns.address == null) // No address specified, create new one
            {
		console.log("Creating NS ...");
                ns.addNameService(ns.address);
            }
            else
            {
		console.log("Starting NS ...");
		ns.startEventsListner();
            }
        });

    }

    addNameService(address) {
        //Declare contract according to parsed ABI
        let myNSContract = TruffleContract(this.abi);
        //Setting contract provider (Metmask / local node)
        myNSContract.setProvider(this.provider.currentProvider);

        //Get deployed contract (ABI contains address) or at specified address
        var contractTarget = this.buildPromise(myNSContract, address);
        var contractInstance;
	var contractObject = this;

        contractTarget.then(function (instance) {
            contractInstance = instance;
            console.log("EtherTrackNS detected at : " + instance.address);
		contractObject.startEventsListner();
        });
    }


    startEventsListner() {
        //Declare contract according to parsed ABI
        let myNSContract = TruffleContract(this.abi);
        //Setting contract provider (Metmask / local node)
        myNSContract.setProvider(this.provider.currentProvider);

        //Get deployed contract (ABI contains address) or at specified address
        var contractTarget = this.buildPromise(myNSContract, this.address);
        var contractInstance;
	var contractObject = this;

        contractTarget.then(function (instance) {
            //Initiate watch for 'updateEntries' events
            instance.updateEntries().watch((err, response) => {
                console.log(response.args.GS1_GLN + " owned by " + response.args.owner);
                logEvents("EtherTrackNS", "updateEntries", response.args.GS1_GLN + " owned by " + response.args.owner);
                displayNodeName(response.args.GS1_GLN, response.args.owner);
            });

		displayNameService("", instance.address);
            

            $.ajax({
                url: '/createNameService',
                type: "POST",
                data: JSON.stringify({ address: contractObject.provider.eth.coinbase, nsAddress: instance.address }),
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                success: function (result) {
                }
            });
	});
   }

    lookupGLN(gln) {
        var glnNodeAddress;

        var contract = this;
        //Declare contract according to parsed ABI
        let myNSContract = TruffleContract(this.abi);
        //Setting contract provider (Metmask / local node)
        myNSContract.setProvider(this.provider.currentProvider);

        myNSContract.at(this.address).then(function (instance) {
            console.log("Querying " + contract.address + " for " + gln + " ...");
            return instance.getNodeAddressByName(gln);
        }).then(function (result) {
            glnNodeAddress = result;
            console.log(contract.address + " : " + result);
            if(contract.lookupCallBack !== undefined)
		contract.lookupCallBack(result);
        });     
       return glnNodeAddress;   
    }

    //Build contract promise
    buildPromise(contract, at_address) {
        //Get deployed contract (ABI contains address) or at specified address
        let contractTarget;
        if (contract.isDeployed())
            contractTarget = contract.deployed(); //ABI address
        else
            contractTarget = contract.at(at_address); //Specified address

        return contractTarget;
    }
}