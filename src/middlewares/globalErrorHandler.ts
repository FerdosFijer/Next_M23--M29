import { Request, Response, NextFunction } from 'express';
import { Prisma } from '../../generated/prisma/client';

function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
    let statusCode = 500;
    let errorMessage = "Internal server error";
    let errorDetails = err;

    //! prismaClientValidationError
    if (err instanceof Prisma.PrismaClientValidationError) {
        statusCode = 400;
        errorMessage = "You provide incorrect field type or missing fields"
    }
    //! prismaClientKnownRequestError
    else if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === "P2025") {
            statusCode = 400;
            errorMessage = "An operation failed because it depends on one or more records that were required but not found."
        }
        else if (err.code === "p2002") {
            statusCode = 400;
            errorMessage = "Duplicate key error"
        }
        else if (err.code === "p2002") {
            statusCode = 400;
            errorMessage = "Foreign key constraint faield"
        }
    }
    //! prismaClientUnknownRequestError
    else if (err instanceof Prisma.PrismaClientUnknownRequestError) {
        statusCode = 500;
        errorMessage = "Error occurred during query execution"
    }
    //! prismaClientRustPanicError same as last 4 line

    //! prismaClientInitializationError
    else if (err instanceof Prisma.PrismaClientInitializationError) {
        if (err.errorCode === "P100") {
            statusCode = 401;
            errorMessage = "Authentication faield please check you rcreditials"
        }
        else if (err.errorCode === "P1001") {
            statusCode = 400;
            errorMessage = "Can't reach database server"
        }
    }

    res.status(statusCode);
    res.json({ message: errorMessage, error: errorDetails });
}

export default errorHandler;