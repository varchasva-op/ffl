export type UserRole = 'admin' | 'player';
export interface User { id: string; name: string; email: string; role: UserRole; playerId?: string; }
export interface Attributes { pace: number; shooting: number; passing: number; dribbling: number; defending: number; physical: number; }
export type Position = 'ST'|'LW'|'RW'|'CAM'|'CM'|'CDM'|'LB'|'RB'|'CB'|'GK';
export interface Crest { shape: 'shield'|'round'|'classic'; icon: string; primaryColor: string; secondaryColor: string; }
export interface Player {
  _id: string; user?: string | { _id: string; name: string; email?: string }; name: string; jerseyName: string; jerseyNumber: number; age: number;
  primaryPosition: Position; secondaryPosition?: Position | ''; preferredFoot: 'Left'|'Right'|'Both'; playstyle: string;
  attributes: Attributes; overall: number; basePrice: number; photoUrl?: string; imageKitFileId?: string;
  auctionStatus: 'unsold'|'active'|'sold'; team?: string | Team | null; soldPrice?: number | null; soldAt?: string | null; countryCode?: string;
}
export interface Team {
  _id: string; name: string; code: string; captainName: string; owner?: string | { _id: string; name: string; email?: string } | null;
  crest: Crest; auctionPurse: number; remainingPurse: number; roster: (string|Player)[];
}
export interface BidRecord { _id?: string; team: string|Team; bidder: string|User; amount: number; increment: number; createdAt: string; }
export interface Auction {
  _id: string; status: 'idle'|'active'|'final-call'|'closed'; activePlayer: string|Player|null; startingPrice: number;
  currentBid: number; leadingTeam: string|Team|null; bidHistory: BidRecord[]; version: number; startedAt?: string|null;
  finalCallAt?: string|null; endedAt?: string|null;
}
export interface Transaction { _id: string; player: string|Player; team: string|Team; finalBid: number; soldAt: string; }
export interface AuthResponse { token: string; user: User; player?: Player; }
export interface TeamForm { name: string; code: string; captainName: string; ownerId?: string; crest: Crest; }
