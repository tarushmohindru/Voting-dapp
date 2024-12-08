import { BankrunProvider, startAnchor } from "anchor-bankrun";
import { Voting } from "../target/types/voting";
import { PublicKey } from "@solana/web3.js";
import { BN, Program } from "@coral-xyz/anchor";
const IDL = require("../target/idl/voting.json");

const votingAddress = new PublicKey(
  "coUnmi3oBUtwtd9fjeAvSsJssXh5A5xyPbhpewyzRVF"
);

describe("voting", () => {
  let context;
  let provider;
  let votingProgram: Program<Voting>;

  beforeAll(async () => {
    context = await startAnchor(
      "",
      [{ name: "voting", programId: votingAddress }],
      []
    );
    provider = new BankrunProvider(context);

    votingProgram = new Program<Voting>(IDL, provider);
  });

  it("Initialized the poll", async () => {
    await votingProgram.methods
      .initializePoll(
        new BN(1),
        "What is your favourite peanut butter flavour",
        new BN(0),
        new BN(1833634642)
      )
      .rpc();

    const [pollAddress] = PublicKey.findProgramAddressSync(
      [new BN(1).toArrayLike(Buffer, "le", 8)],
      votingAddress
    );

    const poll = await votingProgram.account.poll.fetch(pollAddress);

    console.log(poll);

    expect(poll.pollId.toNumber()).toEqual(1);
    expect(poll.description).toEqual(
      "What is your favourite peanut butter flavour"
    );
  });

  it("Initializes the candidate", async () => {
    await votingProgram.methods.initializeCandidate("Smooth", new BN(1)).rpc();
    await votingProgram.methods.initializeCandidate("Crunchy", new BN(1)).rpc();

    const [crunchyAddress] = PublicKey.findProgramAddressSync(
      [new BN(1).toArrayLike(Buffer, "le", 8), Buffer.from("Crunchy")],
      votingAddress
    );
    const crunchyCandidate = await votingProgram.account.candidate.fetch(
      crunchyAddress
    );
    console.log(crunchyCandidate);

    const [smoothAddress] = PublicKey.findProgramAddressSync(
      [new BN(1).toArrayLike(Buffer, "le", 8), Buffer.from("Smooth")],
      votingAddress
    );
    const smoothCandidate = await votingProgram.account.candidate.fetch(
      smoothAddress
    );
    console.log(smoothCandidate);

    expect(crunchyCandidate.candidateName).toEqual("Crunchy");
    expect(smoothCandidate.candidateName).toEqual("Smooth");
  });

  it("Voted", async () => {
    await votingProgram.methods.vote("Smooth", new BN(1)).rpc();

    const [smoothAddress] = PublicKey.findProgramAddressSync(
      [new BN(1).toArrayLike(Buffer, "le", 8), Buffer.from("Smooth")],
      votingAddress
    );
    const smoothCandidate = await votingProgram.account.candidate.fetch(
      smoothAddress
    );
    console.log(smoothCandidate);

    const [crunchyAddress] = PublicKey.findProgramAddressSync(
      [new BN(1).toArrayLike(Buffer, "le", 8), Buffer.from("Crunchy")],
      votingAddress
    );
    const crunchyCandidate = await votingProgram.account.candidate.fetch(
      crunchyAddress
    );
    console.log(crunchyCandidate);

    expect(smoothCandidate.candidateVotes.toNumber()).toEqual(1);
    expect(crunchyCandidate.candidateVotes.toNumber()).toEqual(0);
  });
});
