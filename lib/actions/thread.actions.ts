"use server"

import { revalidatePath } from "next/cache";
import Thread from "../models/thread.model";
import User from "../models/user.model";
import { connectToDB } from "../mongoose"

interface Params {
    text: string,
    author: string,
    communityId: string | null,
    path: string
}

export async function createThread({ text, author, communityId, path }: Params) {
    try {
        connectToDB();

        const createdThread = await Thread.create({
            text,
            author,
            community: null,
        });

        //update user model
        await User.findByIdAndUpdate(author, {
            $push: { threads: createdThread._id }
        })

        revalidatePath(path);
    } catch (error: any) {
        throw new Error(`Error creating thread: ${error}`)
    }

}

export async function fetchPosts(pageNumber = 1, pageSize = 20) {
    connectToDB();

    const skipAmount = (pageNumber - 1) * pageSize;

    //fetch the no parents threads (top level..)
    const postsQuery = await Thread.find({ parentId: { $in: [null, undefined] } })
        .sort({ createAt: 'desc' })
        .skip(skipAmount)
        .limit(pageSize)
        .populate({ path: 'author', model: User })
        .populate({
            path: 'children', populate: {
                path: 'author',
                model: User,
                select: "_id name parentId image"
            }
        })

    const totalPostsCount = await Thread.countDocuments({ parentId: { $in: [null, undefined] } });

    const posts = postsQuery;
    // const posts = await postsQuery.exec();

    const isNext = totalPostsCount > skipAmount + posts.length;

    return { posts, isNext };

}

export async function fetchThreadById(threadId: string) {
    connectToDB();
    try {

        // TODO: populate community 
        const thread = await Thread.findById(threadId).populate({
            path: 'author',
            model: User,
            select: "_id id name image"
        })
        .populate({
        path:'children',
        populate:[
            {
                    path:'author',
                    model: User,
                    select: "_id id name parentId image"
                },
                {
                    path:'author',
                    model: User,
                    select: "_id id name parentId image"
                }
            ]
        })
        .exec();

        return thread;

    } catch (error: any) {
        throw new Error(`faild to fetch user :${error.message}`)
    }


}

export async function addCommentToThread(
    threadId: string,
    commentText: string,
    userId: string,
    path: string
  ) {
    connectToDB();
  
    try {
      // Find the original thread by its ID
      const originalThread = await Thread.findById(threadId);
  
      if (!originalThread) {
        throw new Error("Thread not found");
      }
  
      // Create the new comment thread
      const commentThread = new Thread({
        text: commentText,
        author: userId,
        parentId: threadId, // Set the parentId to the original thread's ID
      });
  
      // Save the comment thread to the database
      const savedCommentThread = await commentThread.save();
  
      // Add the comment thread's ID to the original thread's children array
      originalThread.children.push(savedCommentThread._id);
  
      // Save the updated original thread to the database
      await originalThread.save();
  
      revalidatePath(path);
    } catch (err) {
      console.error("Error while adding comment:", err);
      throw new Error("Unable to add comment");
    }
  }