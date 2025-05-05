import { Entity, PrimaryKey, Property, Unique } from '@mikro-orm/core';
import { v4 as uuidv4 } from 'uuid';

@Entity()
export class User {
    @PrimaryKey({ type: 'uuid' })
    id: string = uuidv4();

    @Property()
    name: string;

    @Property({ unique: true })
    email: string;

    @Property({ hidden: true })
    password: string;

    @Property({ type: 'timestamp', onCreate: () => new Date() })
    createdAt: Date = new Date();

    @Property({ type: 'timestamp', onUpdate: () => new Date() })
    updatedAt: Date = new Date();

    constructor(name: string, email: string, password: string) {
        this.name = name;
        this.email = email;
        this.password = password;
    }
}