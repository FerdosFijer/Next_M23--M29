import { Request, Response } from "express"
import { commentServices } from "./comment.service"

const createComment = async (req: Request, res: Response) => {
    try {
        const user = req.user;
        req.body.authorId = user?.id;
        const result = await commentServices.createComment(req.body)
        res.status(201).json(result)
    } catch (e) {
        res.status(400).json({
            error: "failed to create Comment",
            details: e
        })
    }
}
const getCommentById = async (req: Request, res: Response) => {
    try {
        const { commentId } = req.params;
        const result = await commentServices.getCommentById(commentId as string)
        res.status(200).json(result)
    } catch (e) {
        res.status(400).json({
            error: "failed to create Comment",
            details: e
        })
    }
}
const getCommentByAuthor = async (req: Request, res: Response) => {
    try {
        const { authorId } = req.params;
        const result = await commentServices.getCommentByAuthor(authorId as string)
        res.status(200).json(result)
    } catch (e) {
        res.status(400).json({
            error: "failed to create Comment",
            details: e
        })
    }
}
const deleteComment = async (req: Request, res: Response) => {
    try {
        const user = req.user;
        const { commentId } = req.params;
        const result = await commentServices.deleteComment(commentId as string, user?.id as string)
        res.status(200).json(result)
    } catch (e) {
        res.status(400).json({
            error: "failed to delete Comment",
            details: e
        })
    }
}
const updateComment = async (req: Request, res: Response) => {
    try {
        const user = req.user;
        const { commentId } = req.params;
        const result = await commentServices.updateComment(commentId as string, req.body, user?.id as string)
        res.status(200).json(result)
    } catch (e) {
        res.status(400).json({
            error: "failed to update Comment",
            details: e
        })
    }
}
const moderateComment = async (req: Request, res: Response) => {
    try {
        const { commentId } = req.params;
        const result = await commentServices.moderateComment(commentId as string, req.body)
        res.status(200).json(result)
    } catch (e) {
        const errorMessage = (e instanceof Error) ? e.message : "failed to update Comment";
        res.status(400).json({
            error: errorMessage,
            details: e
        })
    }
}
export const commentController = {
    createComment, getCommentById, getCommentByAuthor, deleteComment, updateComment, moderateComment
}