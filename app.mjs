//const ethers = requrie("ethers");
import { ethers } from "ethers";
import { readIPFS139 } from "./readipfs.mjs";
// import configuration from './build/contracts/Notary139.json';
const CONTRACT_ADDRESS = '0x6931Be9Ac80Eba2726F72264deBe0D64952dB344';
const CONTRACT_ABI = [
  {
    "inputs": [],
    "name": "newContract",
    "outputs": [
      {
        "internalType": "string",
        "name": "content",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "contractStatus",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getContent139",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "newwords",
        "type": "string"
      }
    ],
    "name": "setContent139",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getContractStatus139",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "newStatus",
        "type": "string"
      }
    ],
    "name": "setContractStatus139",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
]; 
var documentContent = '';
let myContract;
var contractAddr = CONTRACT_ADDRESS;
var abi = CONTRACT_ABI;
const buyerAddress = ethers.utils.getAddress('0xd7500804ECE4D1EA1Ba97d634C3bA62e353d9f3D');
const sellerAddress = ethers.utils.getAddress('0xE93057E62E0202CcBcBdb641b679eF179c7E94b9');
const url = "http://127.0.0.1:7545";

  var getConnected = async function () {
  console.log('Connecting to Ganache ...');
  const provider = new ethers.providers.JsonRpcProvider(url);
  myContract = new ethers.Contract(contractAddr, abi, provider);
  }
  
  var setDocumentContent139 = async function (_content) {
    // getting the message
    documentContent = _content; 
    console.log(documentContent);
    // hash the message
    const hashedMessage = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(documentContent)).toString('hex');
    console.log('Hashed Message: ',hashedMessage);
    // writing on Smart Contract
    console.log("Writing the Hash on Blockchain ...")
    const provider = new ethers.providers.JsonRpcProvider(url);
    // const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    //console.log("Signer",signer);
    let myContractWithSigner = new ethers.Contract(contractAddr, abi, signer);
    await myContractWithSigner.setContent139(hashedMessage);
    await myContractWithSigner.setContractStatus139("Pending for both parties");
    // retrieve the hash from Smart Contract
    let docContent = await myContract.getContent139();
    console.log(docContent);
  }
  
  
  async function documentVerification139() {
    documentContent = await ipfsFetch139()
    console.log(documentContent);
    // hash it
    const hashedMessage = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(documentContent)).toString('hex');
    console.log('Hashed Message: ',hashedMessage);
    
    // retrieve the hash from the blockchain
    const provider = new ethers.providers.JsonRpcProvider(url);
    myContract = new ethers.Contract(contractAddr, abi, provider);
    let storedHash = await myContract.getContent139();
    console.log("Stored Hash on the Blockchain: ",storedHash);
    //compare the document hash and stored hash to verify or cancel the request 
    if (storedHash === hashedMessage) {
      console.log("Hash Verified!");
    } else {
      console.log("Hash verification Failed!")
    }
  }
  
  async function signContract139(_signer) {
    // From IPFS
    documentContent = await ipfsFetch139()
    console.log(documentContent);
    const hashedMessage = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(documentContent)).toString('hex');
    // Getting Provider
    const provider = new ethers.providers.JsonRpcProvider(url);
    myContract = new ethers.Contract(contractAddr, abi, provider);
    const signer = provider.getSigner(_signer);
    const address = await signer.getAddress();
    console.log("Signer Address", address);
    
    if (address == buyerAddress) {
      
      // Create a wallet to sign the message with Privatekey
      let privateKey = '88baa3fc6093b4e2ac3af01e6c7df81d490afe00af8e4eff57911549ded032fe';
      console.log("Signer is Buyer!")
      let wallet = new ethers.Wallet(privateKey);
      console.log("Buyer wallet Address: ",wallet.address);
      
      // Sign the string message
      let signature = await wallet.signMessage(hashedMessage);  
      console.log("Signed by BUYER. signature : ", signature);
      let signingAddress = ethers.utils.verifyMessage(hashedMessage, signature);
      console.log('Signing Address: ', signingAddress);
      let contractStatus = await myContract.getContractStatus139();
      console.log(contractStatus);
      if (contractStatus == "Pending for both parties") {
        contractStatus = "Buyer verified, Pending for seller";
      } else if (contractStatus == "Seller verified, Pending for Buyer") {
        contractStatus = "Both verified";
      }
      
      // writing on smart contract
      let myContractWithSigner = new ethers.Contract(contractAddr, abi, signer);
      const tx = await myContractWithSigner.setContractStatus139(contractStatus);
      await tx.wait();
      console.log('Contrct status updated to ' + contractStatus);

    } else if (address == sellerAddress) {
      let privateKey = '840b0379ae14f25992c24971a1cebf4a6662fd3c542e79e338bd331f2b23228c';
      // Create a wallet to sign the message with Privatekey
      let wallet = new ethers.Wallet(privateKey);
      console.log("Signer is SELLER!")
      console.log("Signer wallet Address: ",wallet.address);
      // Sign the Hashed Message
      let signature = await wallet.signMessage(hashedMessage);
      console.log("Signed by SELLER. signature : ", signature);
      // let expanded = ethers.utils.splitSignature(signature);
      // console.log("Expanded signature : ", expanded);
      let signingAddress = ethers.utils.verifyMessage(hashedMessage, signature);
      console.log('Signing Address: ', signingAddress);
      // getting the current contract Status from blockchain
      let contractStatus = await myContract.getContractStatus139();
      console.log(contractStatus);
      if (contractStatus == "Pending for both parties") {
        contractStatus = "Seller verified, Pending for Buyer";
      } else if (contractStatus == "Buyer verified, Pending for seller") {
        contractStatus = "Both verified";
      }
      // writing new status on blockchain
      let myContractWithSigner = new ethers.Contract(contractAddr, abi, signer);
      await myContractWithSigner.setContractStatus139(contractStatus);
      console.log('Contract Status updated to: ', contractStatus);
    } else {
      console.log("Signer is not matching with buyer or seller.");
    }
    await getContractStatus139();
  }
  
  async function cancelContract139() {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const address = await signer.getAddress();
    console.log("Signer Address", address);
    if (address == buyerAddress) {
      let contractStatus = "Canceled by buyer";
      let myContractWithSigner = new ethers.Contract(contractAddr, abi, signer);
      const tx = await myContractWithSigner.setContractStatus139(contractStatus);
      console.log("tx hash",tx.hash);
      await tx.wait();
    } else if (address == sellerAddress) {
      let contractStatus = "Canceled by seller";
      let myContractWithSigner = new ethers.Contract(contractAddr, abi, signer);
      const tx = await myContractWithSigner.setContractStatus139(contractStatus);
      console.log("tx hash",tx.hash);
      await tx.wait();
    } else {
      console.log("Signer is not matching with buyer or seller.");
    }
    await getContractStatus139();
  }
  
  var getContractStatus139 = async function () {
    let contractStatus = await myContract.getContractStatus139();
    console.log("status: "+contractStatus);
    return contractStatus;
  }
  
  async function ipfsFetch139() { 
    console.log('Fetching From IPFS ...')
    let cid = 'QmSaqGgpJBrgTTVWcafob2tVvBiQwSXRnjkhVY2YoRUEsk';
    const content = await readIPFS139(cid);
    return content;
  }
  

  // First Connecting to Blockchain
  console.log("Connecting to a Blockchain ................................................");
  getConnected().then(function (recippt) {
    console.log('Connected',recippt)
  }).catch(function (err) {
    console.log('Connection error',err)
  });

  // Notary will create a Hash from the document on IPFS and store it on the Blockchain
  console.log("Storing document hash on Blockchain ........................................");
  let ipfsContent = await ipfsFetch139().catch(function (err) {console.log('Fetch error',err)});
  await setDocumentContent139(ipfsContent).then(function () {console.log("IPFS content: ",ipfsContent);});

  // Buyer is going to verify the Document by comparing the IPFS content and the Hash content
  console.log("Buyer Verify the IPFS Doc with Hashed Doc on the Blochchain ........................................");
  await documentVerification139();

  // Buyer sign the document by its private key
  console.log("Buyer sign the documnet ........................................");
  await signContract139(0);

  // Seller is going to verify the Document by comparing the IPFS content and the Hash content
  console.log("Seller Verify the IPFS Doc with Hashed Doc on the Blochchain ........................................");
  await documentVerification139();


  // Seller sign the document by its private key
  console.log("seller sign the documnet ........................................");
  await signContract139(1);

  //When someone who are not a buyer or seller try to sign this document they can not sign
  console.log("Someone else try to sign the documnet ........................................");
  await signContract139(2);
