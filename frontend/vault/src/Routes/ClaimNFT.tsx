import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import style from "./ClaimNFT.module.css";
import { GetNFTContract, NFTContractMetadata, NFTToken } from "../Libraries/Near/nft";
import { MouseEvent, useEffect, useState } from "react";
import { GetVaultContractAnonAsync } from '../Libraries/Near/vault';
import Media from '../Components/Media/Media';
import * as nearAPI from "near-api-js";
import Tilt from "react-parallax-tilt";
import { GridLoader } from "react-spinners";
import { ClaimWithExistingAccountHandler, CreateNewAccountAndClaim, ParseToken } from './ClaimNFTHandler';
import ClaimOptionsModal from '../Components/ClaimNFT/ClaimOptionsModal';
import ClaimWithNewAccountModal from '../Components/ClaimNFT/ClaimWithNewAccountModal';
import { NETWORK } from '../Libraries/Near/constants';
import LoaderModal from '../Components/LoaderModal/LoaderModal';
import ordinal from "ordinal";
import Podium from "../Assets/podium_logo.svg";


type NFTDetails = {
    nftMeta: NFTContractMetadata | null,
    nftToken: NFTToken | null
}

export default function ClaimNFT() {
    const { nft, token_id } = useParams();
    let searchParams = useSearchParams();
    let token = window.location.hash === undefined || window.location.hash === null || window.location.hash === '' ? searchParams[0].get('token') ?? '' : window.location.hash;
    const [nftDetails, setnftDetails] = useState<NFTDetails | undefined | null>(undefined);
    const [isClaimable, setIsClaimable] = useState<boolean>(false);
    const [isMediaLoading, setIsMediaLoading] = useState<boolean>(true);
    const [isClaimOptionsModalOpen, setIsClaimOptionsModalOpen] = useState<boolean>(false);
    const [isClaimWithNewAccountModalOpen, setIsClaimWithNewAccountModalOpen] = useState<boolean>(false);
    const [isLoaderModalOpen, setIsLoaderModalOpen] = useState<boolean>(false);
    const navigate = useNavigate();

    function claimOnClick() {
        setIsClaimOptionsModalOpen(true);
    }

    function claimOnExistingAccount() {
        let uuid = window.crypto.randomUUID();
        localStorage.setItem(uuid, JSON.stringify(ParseToken(token)));
        ClaimWithExistingAccountHandler(uuid);
    }

    function claimWithNewAccountOpen() {
        setIsClaimOptionsModalOpen(false);
        setIsClaimWithNewAccountModalOpen(true);
    }

    function onClaimWithNewAccount(accountId: string, privateKey: string, publicKey: string) {
        setIsClaimWithNewAccountModalOpen(false);
        setIsLoaderModalOpen(true);
        CreateNewAccountAndClaim(ParseToken(token), accountId, privateKey, publicKey).then(() => {
            window.location.href = `https://${NETWORK === 'mainnet' ? 'app' : 'testnet'}.mynearwallet.com/auto-import-secret-key#${accountId}/${privateKey}`
        }).catch(e => {
            alert(`${e}`);
        });
    }

    function onClickDownload(e: MouseEvent<HTMLButtonElement>) {
        let anchor = document.createElement<"a">("a");
        let link = `${nftDetails?.nftMeta?.base_uri}/${nftDetails?.nftToken?.metadata.media}`;
        let button = e.currentTarget;
        button.disabled = true;
        fetch(link).then(async data => {
            anchor.href = URL.createObjectURL(await data.blob());;
            anchor.download = link.split('/').pop() ?? "nft";
            anchor.click();
        }).finally(() => {
            button.disabled = false;
        });
    }

    useEffect(() => {
        if (nftDetails === undefined) {
            GetVaultContractAnonAsync().then(async (contract) => {
                let claimable = await contract.get_claimable({
                    nft_account: nft as string,
                    token_id: token_id as string
                });

                if (claimable === null) {
                    setnftDetails(null);
                    return;
                }

                let nftContract = await GetNFTContract(claimable.nft_account_id)

                setnftDetails({
                    nftMeta: await nftContract.nft_metadata(),
                    nftToken: await nftContract.nft_token({
                        token_id: claimable.token_id
                    })
                });

                let claimDetails = ParseToken(token);
                let claimKeyPair = nearAPI.utils.KeyPair.fromString(claimDetails.PrivateKey);

                if (claimable !== null && claimable.public_key === claimKeyPair.getPublicKey().toString()) {
                    setIsClaimable(true);
                }
            })
        }
    });

    if (nftDetails === undefined) {
        return (
            <div className={style.loader_container}>
                <GridLoader color={"rgb(0, 98, 190)"} />
            </div>
        );
    }

    if (nftDetails === null || nftDetails.nftMeta === null || nftDetails.nftToken === null) {
        navigate('/not-found');
        return (
            <div>Claimable does not exist</div>
        )
    }

    let fullName: string | undefined = "";
    let eventName: string | undefined = "";
    let racePosition: string | undefined = "";
    let eventDate: string | undefined = "";
    try {
        let extra = JSON.parse(nftDetails.nftToken.metadata?.extra as string);
        let valuePairs = extra.ValuePairs as Array<{ Key: string, Value: string }>;
        valuePairs.forEach((el) => {
            let key = el.Key.toLowerCase();
            if (key === "recipient name" || key === "recipientname") {
                fullName = el.Value;
            } else if (key === "event name" || key === "eventname") {
                eventName = el.Value;
            } else if (key === "race position" || key === "raceposition") {
                racePosition = el.Value
            } else if (key === "event date" || key === "eventdate") {
                eventDate = el.Value
            }
        });
    } catch (_) {
        fullName = "Participant";
        eventName = "World Triathlon";
    }

    return (
        <div className={style.main_container}>
            <div className={style.greetings}>
                <p><b>Congratulations {fullName} for coming {ordinal(parseInt(racePosition, 10))} in the {eventName}, {eventDate}.</b></p>
                <p>Your virtual medal is ready to claim as an NFT for all of the benefits and features. Or download the media file as a digital collectible.</p>
            </div>
            <div className={style.flex_container}>
                <Tilt tiltReverse={true} tiltMaxAngleX={7} tiltMaxAngleY={7} glareReverse={true} >
                    <div className={style.media_container}>
                        <Media src={`${nftDetails.nftMeta.base_uri}/${nftDetails.nftToken.metadata.media}`} isLoadingSetter={setIsMediaLoading} />    
                    </div>
                </Tilt>
                <div className={style.card}>
                    <div className={style.card_header}>NFT</div>
                    <div className={style.card_body}>
                        <hr />
                        <span>Digital collective</span>
                        <hr />
                        <span>Social media ready</span>
                        <hr />
                        <span>Sponsor rewards enabled</span>
                        <hr />
                        <span>Blockchain certified carbon offset</span>
                        <hr />
                        <span>NFT minted to Blockchain</span>
                        <hr />
                    </div>
                    <div className={style.card_footer}>
                        <button onClick={claimOnClick} disabled={!isMediaLoading || !isClaimable}>Claim your NFT</button>
                    </div>
                </div>
                <div className={style.card}>
                    <div className={style.card_header}>Media file</div>
                    <div className={style.card_body}>
                        <hr />
                        <span>Digital collective</span>
                        <hr />
                        <span>Social media ready</span>
                        <hr />
                    </div>
                    <div className={style.card_footer}>
                        <button onClick={onClickDownload}>Download</button>
                    </div>
                </div>
            </div>
            <img alt="podium_logo" className={style.podium_logo} src={Podium} />
            <ClaimOptionsModal isOpen={isClaimOptionsModalOpen} onRequestClose={() => { setIsClaimOptionsModalOpen(false) }} onClaimWithNewAccount={claimWithNewAccountOpen} onClaimWithExistingAccount={claimOnExistingAccount} />
            <ClaimWithNewAccountModal isOpen={isClaimWithNewAccountModalOpen} onRequestClose={() => setIsClaimWithNewAccountModalOpen(false)} onClaimWithNewAccount={onClaimWithNewAccount} />
            <LoaderModal isOpen={isLoaderModalOpen} />
        </div>
    );
}