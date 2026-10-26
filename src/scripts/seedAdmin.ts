import { prisma } from "../lib/prisma";
import { UserRole } from "../middlewares/auth";

async function seedAdmin() {
    try {
        const adminData = {
            name: "Admin Saheb 1",
            email: "admin1@admin.com",
            role: UserRole.ADMIN,
            password: "admin1234"
        }
        // check user exist on db or not
        const existingUser = await prisma.user.findUnique({
            where: {
                email: adminData.email
            }
        })
        if (existingUser) {
            throw new Error("User already exists !!")
        }
        const signUpAdmin = await fetch("http://localhost:5000/api/auth/sign-up/email", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Origin: process.env.APP_URL ?? "http://localhost:4000",
            },
            body: JSON.stringify(adminData)
        })
        console.log(signUpAdmin);
        if (signUpAdmin.ok) {
            await prisma.user.update({
                where: {
                    email: adminData.email
                },
                data: {
                    emailVerified: true
                }
            })
        }

    } catch (error) {
        console.log(error);

    }
}
seedAdmin()