module sipnip::escrow {
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::event;

    const EInvalidRecipient: u64 = 0;

    const ENotSender: u64 = 1;


    public struct Escrow has key, store {
        id: UID,
        sender: address,
        recipient: address,
        balance: Coin<SUI>,
    }

    public struct EscrowCreated has copy, drop {
        escrow_id: address,
        sender: address,
        recipient: address,
        amount: u64,
    }

    public struct EscrowDeposited has copy, drop {
        escrow_id: address,
        amount_added: u64,
        new_total: u64,
    }

    public struct EscrowReleased has copy, drop {
        escrow_id: address,
        recipient: address,
        amount: u64,
    }

    public struct EscrowRefunded has copy, drop {
        escrow_id: address,
        sender: address,
        amount: u64,
    }

    public entry fun create_escrow(payment: Coin<SUI>, recipient: address, ctx: &mut TxContext) {
        let sender = ctx.sender();
        assert!(recipient != sender, EInvalidRecipient);

        let amount = payment.value();
        let escrow = Escrow {
            id: object::new(ctx),
            sender,
            recipient,
            balance: payment,
        };
        let escrow_id = object::uid_to_address(&escrow.id);

        event::emit(EscrowCreated { escrow_id, sender, recipient, amount });
        transfer::share_object(escrow);
    }


    public entry fun deposit(escrow: &mut Escrow, extra: Coin<SUI>, ctx: &mut TxContext) {
        assert!(ctx.sender() == escrow.sender, ENotSender);

        let amount_added = extra.value();
        escrow.balance.join(extra);

        event::emit(EscrowDeposited {
            escrow_id: object::uid_to_address(&escrow.id),
            amount_added,
            new_total: escrow.balance.value(),
        });
    }


    public entry fun release_payment(escrow: Escrow, ctx: &mut TxContext) {
        let Escrow { id, sender, recipient, balance } = escrow;
        assert!(ctx.sender() == sender, ENotSender);

        let amount = balance.value();
        transfer::public_transfer(balance, recipient);

        event::emit(EscrowReleased {
            escrow_id: object::uid_to_address(&id),
            recipient,
            amount,
        });
        object::delete(id);
    }

    public entry fun refund(escrow: Escrow, ctx: &mut TxContext) {
        let Escrow { id, sender, recipient: _, balance } = escrow;
        assert!(ctx.sender() == sender, ENotSender);

        let amount = balance.value();
        transfer::public_transfer(balance, sender);

        event::emit(EscrowRefunded {
            escrow_id: object::uid_to_address(&id),
            sender,
            amount,
        });
        object::delete(id);
    }


    public fun sender(escrow: &Escrow): address { escrow.sender }
    public fun recipient(escrow: &Escrow): address { escrow.recipient }
    public fun amount(escrow: &Escrow): u64 { escrow.balance.value() }
}