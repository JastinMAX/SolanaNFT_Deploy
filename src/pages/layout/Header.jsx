import React, { useContext, useEffect, useMemo } from "react";
import NavMobile from "./naviagtions/NavMobile";
import CandyMachineImage from "../../assets/candy-machine.png";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { useState } from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import "./Header.css"; // Import CSS file
import {
  Metaplex,
  walletAdapterIdentity,
  toBigNumber,
  toDateTime,
  sol,
} from "@metaplex-foundation/js";

function Header() {
  const [isMainnet, setIsMainnet] = useState(false);
  const [collectionAdd, setCollectionAdd] = useState([]);
  const [candyMachineAdd, setCandyMachineAdd] = useState([]);
  // Handle checkbox change
  const handleCheckboxChange = (event) => {
    // setIsMainnet(event.target.checked);
    setIsMainnet((prevIsMainnet) => !prevIsMainnet);
  };

  const NFT_METADATA_DEVNET = [
    "https://devnet.irys.xyz/2PTUMEZc9BY8CYBWFehQRGEN1NArQb1qAsqAKmT7SvE6", // Black
    "https://devnet.irys.xyz/9Hp1Ri6oQJvZcJVnY9BY3s48tdBrmQSUGi4R3vFUGnGM", // Blue
    "https://devnet.irys.xyz/DCjDyYbH4ved4ddFihVyvLCBmt7qJaCFVFMVSbRWwAF6", // White
  ];
  const NFT_METADATA_MAINNET = [
    "https://mainnet.irys.xyz/2PTUMEZc9BY8CYBWFehQRGEN1NArQb1qAsqAKmT7SvE6", // Black ! Replace with Mainnet irys URL from meta upload
    "https://mainnet.irys.xyz/9Hp1Ri6oQJvZcJVnY9BY3s48tdBrmQSUGi4R3vFUGnGM", // Blue  ! Replace with Mainnet irys URL from meta upload
    "https://mainnet.irys.xyz/DCjDyYbH4ved4ddFihVyvLCBmt7qJaCFVFMVSbRWwAF6", // White ! Replace with Mainnet irys URL from meta upload
  ];

  const colors = ["Black", "Blue", "White"];
  const { connected, publicKey, signTransaction } = useWallet();
  const wallet = useWallet();
  const QUICKNODE_RPC_DEVNET = "https://api.devnet.solana.com";
  const QUICKNODE_RPC_MAINNET = "https://api.mainnet-beta.solana.com";

  // Initialize Metaplex with wallet identity
  const METAPLEX = useMemo(() => {
    if (publicKey) {
      const SOLANA_CONNECTION = new Connection(
        isMainnet ? QUICKNODE_RPC_MAINNET : QUICKNODE_RPC_DEVNET,
        {
          commitment: "finalized",
        }
      );
      return Metaplex.make(SOLANA_CONNECTION).use(
        walletAdapterIdentity(wallet)
      );
    }
    return null;
  }, [wallet, isMainnet]);

  useEffect(() => {
    if (isMainnet) {
      console.log("The current net is Main-NET");
    } else {
      console.log("The current net is Dev-NET");
    }
  }, [isMainnet]);

  useEffect(() => {
    addLogsToConsole("METAPLEX created:", METAPLEX);
  }, [METAPLEX]);

  const handleWalletConnect = () => {
    addLogsToConsole("Connected to wallet:" + publicKey);
  };
  useEffect(() => {
    if (connected) {
      handleWalletConnect();
    }
  }, [connected]);

  const [consoleResult, setConsoleResult] = useState("Console:");

  const addLogsToConsole = (newLine) => {
    setConsoleResult((prevConsoleResult) => prevConsoleResult + "\n" + newLine);
  };

  const createCollectionNft = async (index) => {
    const { nft: collectionNft } = await METAPLEX.nfts().create({
      name: `Krypt NFT Collection ${colors[index]}`,
      uri: isMainnet ? NFT_METADATA_MAINNET[index] : NFT_METADATA_DEVNET[index],
      sellerFeeBasisPoints: 500,
      isCollection: true,
      updateAuthority: wallet,
      properties: {
        customProperty: `${Date.now()}`,
      },
    });
    let add = collectionAdd;
    add[index] = collectionNft.address.toString();
    setCollectionAdd(add);
    addLogsToConsole(
      `✅ - Minted Collection NFT ${index}: ${collectionNft.address.toString()}`
    );
    addLogsToConsole(
      `     https://explorer.solana.com/address/${collectionNft.address.toString()}?`
    );
  };

  const generateCandyMachine = async (index) => {
    console.log(index, collectionAdd[index]);
    const candyMachineSettings = {
      itemsAvailable: toBigNumber(33), // Collection Size: 99
      sellerFeeBasisPoints: 500, // 10% Royalties on Collection
      symbol: "KVM",
      maxEditionSupply: toBigNumber(0), // 0 reproductions of each NFT allowed
      isMutable: true,
      creators: [{ address: wallet.publicKey, share: 100 }],
      collection: {
        address: new PublicKey(collectionAdd[index]), // Can replace with your own NFT or upload a new one
        updateAuthority: wallet,
      },
    };
    const { candyMachine } = await METAPLEX.candyMachines().create(
      candyMachineSettings
    );
    let add = candyMachineAdd;
    add[index] = candyMachine.address.toString();
    setCandyMachineAdd(add);
    addLogsToConsole(
      `✅ - Created Candy Machine ${index}: ${candyMachine.address.toString()}`
    );
    addLogsToConsole(
      `     https://explorer.solana.com/address/${candyMachine.address.toString()}?`
    );
  };

  const updateCandyMachine = async (index) => {
    const candyMachine = await METAPLEX.candyMachines().findByAddress({
      address: new PublicKey(candyMachineAdd[index]),
    });

    const { response } = await METAPLEX.candyMachines().update({
      candyMachine,
      guards: {
        startDate: { date: toDateTime("2024-12-1T16:00:00Z") },
        mintLimit: {
          id: 1,
          limit: 99,
        },
        solPayment: {
          amount: sol(0.7),
          destination: METAPLEX.identity().publicKey,
        },
      },
    });

    addLogsToConsole(`✅ - Updated Candy Machine: ${candyMachineAdd[index]}`);
    addLogsToConsole(
      `     https://explorer.solana.com/tx/${response.signature}?`
    );
  };

  async function addItems(index) {
    const candyMachine = await METAPLEX.candyMachines().findByAddress({
      address: new PublicKey(candyMachineAdd[index]),
    });
    for (let j = 0; j < 11; j++) {
      const items = [];
      for (let i = 0; i < 3; i++) {
        addLogsToConsole(`${colors[index]} Adding item ${3 * j + i + 1}`);
        const edit = `${3*j}` + `${i}` + Date.now().toLocaleString();
        items.push({
          name: `Krypt x Meshvault ${colors[index]} # ${3 * j + i + 1}`,
          attributes:{
            edition: edit
          },
          uri: isMainnet
            ? NFT_METADATA_MAINNET[index]
            : NFT_METADATA_DEVNET[index],
        });
      }
      try {
        const { response } = await METAPLEX.candyMachines().insertItems(
          {
            candyMachine,
            items: items,
            index: j * 3,
          },
          { commitment: "finalized" }
        );
      } catch(err) {
        console.log('addItemError:', err);
      }
      addLogsToConsole(
        `✅ - Items added to Candy Machine ${index}: ${candyMachineAdd[index]}`
      );
    }
  }
  
  const createCollectionNFTClicked = async () => {
    addLogsToConsole("Creating NFT Collections ...");
    for (let i = 0; i < 3; ++i) {
      await createCollectionNft(i);
    }
    addLogsToConsole("Collection NFT Addresses addition complte");
  };

  const candyMachineClick = async () => {
    addLogsToConsole("Generating candy machine ...");
    for (let i = 0; i < 3; ++i) {
      await generateCandyMachine(i);
    }
    addLogsToConsole("Generating candy machine addition complte");
  };

  const updateCandyGuard = async () => {
    addLogsToConsole("Updating CandyGuard ...");
    for (let i = 0; i < 3; ++i) {
      await updateCandyMachine(i);
    }
    addLogsToConsole("Updating CandyGuard addition complete");
  };

  const addItemClick = () => {
    addLogsToConsole("AddItemClick function called ...");
    for (let i = 0; i < 3; ++i) {
      addItems(i);
    }
    addLogsToConsole("AddItemClick function call completed");
  };

  return (
    <React.Fragment>
      <section className=" lg:hidden">
        <NavMobile />
      </section>
      <main className="main-header bg-primary flex items-center justify-between px-5">
        <img className="header-logo" src={CandyMachineImage} />
        <div>
          <input
            type="checkbox"
            id="isMainnet"
            name="isMainnet"
            checked={isMainnet}
            onChange={handleCheckboxChange}
          />
          <span onClick={handleCheckboxChange}>Is main-net?</span>
        </div>
        <section className="lg:block hidden wallet-connect-btn">
          <WalletMultiButton />
        </section>

        <div className="buttons">
          <button
            onClick={async () => await createCollectionNFTClicked()}
            className={`submit-button cursor-pointer justify-center items-center`}
          >
            Create NFT Collection
          </button>
          <button
            onClick={async () => await candyMachineClick()}
            className={`submit-button cursor-pointer justify-center items-center`}
          >
            Generate Candy Machine
          </button>
          <div
            onClick={() => updateCandyGuard()} // temp index
            className={`submit-button cursor-pointer justify-center items-center`}
          >
            Update Candy Guard
          </div>
          <div
            onClick={() => addItemClick()}
            className={`submit-button cursor-pointer justify-center items-center`}
          >
            Add Items
          </div>
        </div>
        <textarea
          readOnly
          className="console-area"
          value={consoleResult}
        ></textarea>
      </main>
    </React.Fragment>
  );
}

export default Header;
