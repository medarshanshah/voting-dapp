import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { Keypair } from '@solana/web3.js'
import { Voting } from '../target/types/voting';
import { startAnchor } from 'solana-bankrun';
import { BankrunProvider } from 'anchor-bankrun';


const IDL = require('../target/idl/voting.json');

const votingAddress = new PublicKey("6z68wfurCMYkZG51s1Et9BJEd9nJGUusjHXNt4dGbNNF");

describe('Voting', () => {
  
  let context;
  let provider;
  let votingProgram: { methods: { initializePoll: (arg0: any, arg1: string, arg2: any, arg3: any) => { (): any; new(): any; rpc: { (): any; new(): any; }; }; initializeCandidate: (arg0: string, arg1: any) => { (): any; new(): any; rpc: { (): any; new(): any; }; }; vote: (arg0: string, arg1: any) => { (): any; new(): any; rpc: { (): any; new(): any; }; }; }; account: { poll: { fetch: (arg0: any) => any; }; candidate: { fetch: (arg0: any) => any; }; }; };

  beforeAll(async () => {
    const context = await startAnchor("", [{name: "voting", programId: votingAddress}], []);
    const provider = new BankrunProvider(context);

    const votingProgram = new Program<Voting>(
      IDL,
      provider,
    );
  })
  
  
  // Configure the client to use the local cluster.
  // anchor.setProvider(anchor.AnchorProvider.env());

  it('initialize Poll', async () => {

    await votingProgram.methods.initializePoll(
      new anchor.BN(1),
      "What is your favorite type of peanut butter?",
      new anchor.BN(0),
      new anchor.BN(1729350874),
    ).rpc();

    const [pollAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, 'le', 8)],
      votingAddress
    )

    const poll = await votingProgram.account.poll.fetch(pollAddress);
    console.log(poll);

    expect(poll.pollId.toNumber()).toEqual(1);
    expect(poll.description).toEqual("What is your favorite type of peanut butter?");
    expect(poll.pollStart.toNumber()).toBeLessThan(poll.pollEnd.toNumber());
  });

  it('initialize Candidate', async () => {

    await votingProgram.methods.initializeCandidate(
      "Smooth",
      new anchor.BN(1),
    ).rpc();
    await votingProgram.methods.initializeCandidate(
      "Crunchy",
      new anchor.BN(1),
    ).rpc();

    const [crunchyAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, 'le', 8), Buffer.from("Crunchy")],
      votingAddress
    );
    const crunchyCandidate = await votingProgram.account.candidate.fetch(crunchyAddress);
    console.log(crunchyCandidate);
    expect(crunchyCandidate.candidateVotes.toNumber()).toEqual(0);

    const [smoothAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, 'le', 8), Buffer.from("Smooth")],
      votingAddress
    );
    const smoothCandidate = await votingProgram.account.candidate.fetch(smoothAddress);
    console.log(smoothCandidate);    
    expect(smoothCandidate.candidateVotes.toNumber()).toEqual(0);
  });

  it('vote', async () => {
    await votingProgram.methods
      .vote(
        "Smooth",
        new anchor.BN(1)
      ).rpc()

      const [smoothAddress] = PublicKey.findProgramAddressSync(
        [new anchor.BN(1).toArrayLike(Buffer, 'le', 8), Buffer.from("Smooth")],
        votingAddress
      );
      const smoothCandidate = await votingProgram.account.candidate.fetch(smoothAddress);
      console.log(smoothCandidate);    
      expect(smoothCandidate.candidateVotes.toNumber()).toEqual(1);
  });
});
