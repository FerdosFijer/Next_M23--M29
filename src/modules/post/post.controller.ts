import { Request, Response } from "express";
import { postServices } from "./post.service";
import { PostStatus } from "../../../generated/prisma/enums";
import paginatinSortingHelper from "../../helpers/paginationSortingHelper";
import { UserRole } from "../../middlewares/auth";

const createPost = async (req: Request, res: Response) => {
    try {
        console.log(req.user);
        const user = req.user;
        if (!user) {
            return res.status(400).json({
                error: "Unauthorized",
            })
        }
        const result = await postServices.createPost(req.body, user.id)
        res.status(201).json(result)
    } catch (e) {
        res.status(400).json({
            error: "failed to create post",
            details: e
        })
    }
}
const getAllPost = async (req: Request, res: Response) => {
    try {
        const { search } = req.query
        const searchString = typeof search === 'string' ? search : undefined

        const tags = req.query.tags ? (req.query.tags as string).split(",") : [];

        const isFeatured = req.query.isFeatured
            ? req.query.isFeatured === 'true'
                ? true
                : req.query.isFeatured === 'false'
                    ? false
                    : undefined
            : undefined

        const status = req.query.status as PostStatus | undefined

        const authorId = req.query.authorId as string | undefined

        // const page = Number(req.query.page ?? 1)
        // const limit = Number(req.query.limit ?? 10)
        // const skip = (page - 1) * limit

        // const sortBy = req.query.sortBy as string | undefined
        // const sortOrder = req.query.sortOrder as string | undefined

        //!uporer 5 ta line er jonno (options & paginatinsSortingHelper) banay nisi + next line

        const { page, limit, skip, sortBy, sortOrder } = paginatinSortingHelper(req.query)

        const result = await postServices.getAllPost({ search: searchString, tags, isFeatured, status, authorId, page, limit, skip, sortBy, sortOrder })
        res.status(200).json(result)
    } catch (e) {
        res.status(400).json({
            error: "failed to create post",
            details: e
        })
    }
}
const getPostById = async (req: Request, res: Response) => {
    try {
        const { postId } = req.params;

        if (!postId || typeof postId !== "string") {
            throw new Error("Post Id is required!")
        }
        const result = await postServices.getPostById(postId);
        res.status(200).json(result)
    } catch (e) {
        res.status(400).json({
            error: "failed to create post",
            details: e
        })
    }
}
const getMyPosts = async (req: Request, res: Response) => {
    try {
        const user = req.user;
        if (!user) {
            throw new Error(" You are unauthorized!")
        }
        console.log(user);
        const result = await postServices.getMyPosts(user.id);
        res.status(200).json(result)
    } catch (e) {
        console.log(e);
        res.status(400).json({
            error: " post fetched failed",
            details: e
        })
    }
}
const updateMyPosts = async (req: Request, res: Response) => {
    try {
        const user = req.user;
        if (!user) {
            throw new Error(" You are unauthorized!")
        }
        const { postId } = req.params;
        const isAdmin = user.role === UserRole.ADMIN
        const result = await postServices.updateMyPosts(postId as string, req.body, user.id, isAdmin);
        res.status(200).json(result)
    } catch (e) {
        const errorMessage = (e instanceof Error) ? e.message : "post update failed";
        res.status(400).json({
            error: errorMessage,
            details: e
        })
    }
}
const deletePosts = async (req: Request, res: Response) => {
    try {
        const user = req.user;
        if (!user) {
            throw new Error(" You are unauthorized!")
        }
        const { postId } = req.params;
        const isAdmin = user.role === UserRole.ADMIN
        const result = await postServices.deletePost(postId as string, user.id, isAdmin);
        res.status(200).json(result)
    } catch (e) {
        const errorMessage = (e instanceof Error) ? e.message : "post delete failed";
        res.status(400).json({
            error: errorMessage,
            details: e
        })
    }
}
const getStats = async (req: Request, res: Response) => {
    try {
        const result = await postServices.getStats();
        res.status(200).json(result)
    } catch (e) {
        const errorMessage = (e instanceof Error) ? e.message : "stats fetched failed";
        res.status(400).json({
            error: errorMessage,
            details: e
        })
    }
}

export const PostController = {
    createPost, getAllPost, getPostById, getMyPosts, updateMyPosts, deletePosts, getStats
}