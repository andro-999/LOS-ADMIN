export interface Slot {
    regalnummer: string;
    filialcode: string;
    artikelnummer: string;
    vintageyear: string;
    charge: string;
    ist_kommiplatz: boolean;
    height: string;
    width: string;
    depth: string;
    nve: string;
    amountbase: number;
    amount: number;
    unit: string;
    amountunit: number;
    tax: boolean;
    locked: boolean;
    _bio: boolean;
    liquor: boolean;
    orderarticle: boolean;
    pals: string;
    ist_aktiv: boolean;
    createdat: string;
    createdby: string;
    updatedat: string;
    updatedby: string;
}

export interface SlotSearchCriteria {
    regalnummer?: string;
    filialcode?: string;
    artikelnummer?: string;
    vintageyear?: string;
    charge?: string;
    height?: string;
    width?: string;
    depth?: string;
    nve?: string;
    createdby?: string;
    createdat?: string;
    updatedby?: string;
    updatedat?: string;
    amountbase?: string;
    amount?: string;
    unit?: string;
    amountunit?: string;
    pals?: string;
    ist_kommiplatz?: boolean | null;
    locked?: boolean | null;
    _bio?: boolean | null;
    liquor?: boolean | null;
    orderarticle?: boolean | null;
    tax?: boolean | null;
    onlyOccupied?: boolean;
    searchTerm?: string;
}

export interface CreateSlotRequest {
    regalnummer: string;
    filialcode: string;
    artikelnummer: string;
    vintageyear: string;
    charge: string;
    ist_kommiplatz: boolean;
    height: string;
    width: string;
    depth: string;
    nve: string;
    amountbase: number;
    amount: number;
    unit: string;
    amountunit: number;
    tax: boolean;
    locked: boolean;
    _bio: boolean;
    liquor: boolean;
    orderarticle: boolean;
    pals: string;
    ist_aktiv: boolean;
}

export interface SlotMutationResponse {
    msg: string;
    success: boolean;
}

export interface EditSlotRequest {
    regalnummer: string;
    filialcode: string;
    artikelnummer: string;
    vintageyear: string;
    charge: string;
    ist_kommiplatz: boolean;
    height: string;
    width: string;
    depth: string;
    nve: string;
    amountbase: number;
    amount: number;
    unit: string;
    amountunit: number;
    tax: boolean;
    locked: boolean;
    is_bio: boolean;
    liquor: boolean;
    orderarticle: boolean;
    pals: string;
    ist_aktiv: boolean;
    createdat: string;
    createdby: string;
    updatedat: string;
    updatedby: string;
}
