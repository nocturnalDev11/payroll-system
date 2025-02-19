import mongoose from 'mongoose'
const { Schema, model } = mongoose;

const USERNAME_INVALID_CHARACTERS = ' ?;:,.`\'"(){}[]|\\/';

function usernameValidator(value) {
    for (let i = 0; i < USERNAME_INVALID_CHARACTERS.length; i++) {
        if (value.includes(USERNAME_INVALID_CHARACTERS[i])) {
            return false;
        }
    }
    return true;
}

const employeeSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minLength: [4, 'Username must be at least 4 characters long'],
        validate: [usernameValidator, 'Invalid username'],
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
    },
    password: {
        type: String,
        required: true,
        minLength: [8, 'Password must be at least 8 characters long'],
    },
    birthday: {
        type: Date,
        required: false,
        default: null,
    },
    hireDate: {
        type: Date,
        required: false,
        default: null,
    },
    contactInfo: {
        type: String,
        required: false,
        default: null,
    },
    civilStatus: {
        type: String,
        required: false,
        default: null,
    },
    sss: {
        type: String,
        required: false,
        default: null,
    },
    philHealth: {
        type: String,
        required: false,
        default: null,
    },
    hdmf: {
        type: String,
        required: false,
        default: null,
    },
    role: {
        type: String,
        default: 'employee',
    },
});

export const Employee = model('Employee', employeeSchema);
