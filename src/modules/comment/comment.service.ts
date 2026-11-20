import { CommentStatus } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";

const createComment = async (payload: {
    content: string;
    authorId: string;
    postId: string;
    parentId?: string
}) => {
    await prisma.post.findUniqueOrThrow({
        where: {
            id: payload.postId
        }
    })
    if (payload.parentId) {
        await prisma.comment.findUniqueOrThrow({
            where: {
                id: payload.parentId
            }
        })
    }
    const result = await prisma.comment.create({
        data: payload
    })
    return result
}
const getCommentById = async (id: string) => {  //! id or commentId j kono name e receive kora jay jodio controller e alada name takte pare
    return await prisma.comment.findUnique({
        where: {
            id
        },
        include: {
            post: {
                select: {
                    id: true,
                    title: true,
                    views: true
                }
            }
        }
    })
}
const getCommentByAuthor = async (authorId: string) => {
    return await prisma.comment.findMany({
        where: {
            authorId
        },
        orderBy: { createdAt: "desc" },
        include: {
            post: {
                select: {
                    id: true,
                    title: true
                }
            }
        }
    })
}
//! nijer comment delete korte parbe (login thakte hobe) & nijer comment ki na check korte hobe
const deleteComment = async (commentId: string, authorId: string) => {
    const commentData = await prisma.comment.findFirst({
        where: {
            id: commentId,
            authorId
        },
        select: {
            id: true
        }
    })
    if (!commentData) {
        throw new Error("Your provided input is invalid")
    }
    return await prisma.comment.delete({
        where: {
            id: commentData.id
        }
    })
}
//author id, comment id, updated data lagbe
const updateComment = async (commentId: string, data: { content?: string, status?: CommentStatus }, authorId: string) => {
    const commentData = await prisma.comment.findFirst({
        where: {
            id: commentId,
            authorId
        },
        select: {
            id: true
        }
    })
    if (!commentData) {
        throw new Error("Your provided input is invalid")
    }
    return await prisma.comment.update({
        where: {
            id: commentId,
            authorId
        },
        data
    })
}
//! only admin kono post approve or reject kore dite parbe
const moderateComment = async (id: string, data: { status: CommentStatus }) => {
    // console.log("moderate comment here", { id, data });
    const commentData = await prisma.comment.findUniqueOrThrow({
        where: {
            id
        },
        select: {
            id: true,
            status: true
        }
    });
    // approve or reject korar somoy already thakle (same status hoile) abar update korbo na 
    if (commentData.status === data.status) {
        throw new Error(`Your provided status (${data.status}) is already up to date`)
    }
    return await prisma.comment.update({
        where: {
            id
        },
        data
    })
}

export const commentServices = {
    createComment,
    getCommentById,
    getCommentByAuthor,
    deleteComment,
    updateComment,
    moderateComment
}