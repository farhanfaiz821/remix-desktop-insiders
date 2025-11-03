import { Response } from 'express';
import { AuthRequest, ChatMessage } from '../types';
import prisma from '../config/database';
import openaiService from '../services/openai.service';

export class ChatController {
  async sendMessage(req: AuthRequest, res: Response) {
    try {
      const { message } = req.body;
      const userId = req.user!.id;

      // Get recent conversation history (last 10 messages)
      const recentMessages = await prisma.message.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          role: true,
          content: true,
          response: true,
        },
      });

      // Build conversation context
      const conversationHistory: ChatMessage[] = [];
      
      // Add system message
      conversationHistory.push({
        role: 'system',
        content: 'You are ZYNX AI, a helpful and friendly AI assistant. Provide clear, concise, and accurate responses.',
      });

      // Add recent messages in chronological order
      recentMessages.reverse().forEach((msg) => {
        conversationHistory.push({
          role: 'user',
          content: msg.content,
        });
        if (msg.response) {
          conversationHistory.push({
            role: 'assistant',
            content: msg.response,
          });
        }
      });

      // Add current message
      conversationHistory.push({
        role: 'user',
        content: message,
      });

      // Get AI response
      const { response, tokens } = await openaiService.chat(conversationHistory);

      // Save message and response
      const savedMessage = await prisma.message.create({
        data: {
          userId,
          role: 'user',
          content: message,
          response,
          tokens,
        },
        select: {
          id: true,
          role: true,
          content: true,
          response: true,
          tokens: true,
          createdAt: true,
        },
      });

      // Log audit
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'chat',
          resource: 'message',
          details: `Sent message, tokens: ${tokens}`,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        },
      });

      res.json({
        success: true,
        data: {
          message: savedMessage,
          response,
        },
      });
    } catch (error: any) {
      console.error('Chat error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to process message',
      });
    }
  }

  async getHistory(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { limit = '50', offset = '0' } = req.query;

      const messages = await prisma.message.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
        select: {
          id: true,
          role: true,
          content: true,
          response: true,
          tokens: true,
          createdAt: true,
        },
      });

      const total = await prisma.message.count({
        where: { userId },
      });

      res.json({
        success: true,
        data: {
          messages: messages.reverse(),
          total,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
        },
      });
    } catch (error: any) {
      console.error('Get history error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get chat history',
      });
    }
  }

  async deleteMessage(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const message = await prisma.message.findFirst({
        where: { id, userId },
      });

      if (!message) {
        return res.status(404).json({
          success: false,
          error: 'Message not found',
        });
      }

      await prisma.message.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: 'Message deleted successfully',
      });
    } catch (error: any) {
      console.error('Delete message error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete message',
      });
    }
  }

  async exportChat(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { format = 'json', startDate, endDate } = req.query;

      const whereClause: any = { userId };

      if (startDate || endDate) {
        whereClause.createdAt = {};
        if (startDate) whereClause.createdAt.gte = new Date(startDate as string);
        if (endDate) whereClause.createdAt.lte = new Date(endDate as string);
      }

      const messages = await prisma.message.findMany({
        where: whereClause,
        orderBy: { createdAt: 'asc' },
        select: {
          content: true,
          response: true,
          createdAt: true,
        },
      });

      if (format === 'json') {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=chat-export.json');
        return res.json({
          exportDate: new Date().toISOString(),
          messageCount: messages.length,
          messages,
        });
      }

      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=chat-export.csv');
        
        let csv = 'Date,User Message,AI Response\n';
        messages.forEach((msg) => {
          const date = msg.createdAt.toISOString();
          const userMsg = msg.content.replace(/"/g, '""');
          const aiMsg = (msg.response || '').replace(/"/g, '""');
          csv += `"${date}","${userMsg}","${aiMsg}"\n`;
        });
        
        return res.send(csv);
      }

      if (format === 'txt') {
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', 'attachment; filename=chat-export.txt');
        
        let txt = 'ZYNX AI Chat Export\n';
        txt += `Export Date: ${new Date().toISOString()}\n`;
        txt += `Total Messages: ${messages.length}\n`;
        txt += '='.repeat(80) + '\n\n';
        
        messages.forEach((msg) => {
          txt += `[${msg.createdAt.toISOString()}]\n`;
          txt += `User: ${msg.content}\n`;
          txt += `AI: ${msg.response || 'No response'}\n`;
          txt += '-'.repeat(80) + '\n\n';
        });
        
        return res.send(txt);
      }

      res.status(400).json({
        success: false,
        error: 'Invalid format. Use json, csv, or txt',
      });
    } catch (error: any) {
      console.error('Export chat error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to export chat',
      });
    }
  }

  async clearHistory(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;

      const result = await prisma.message.deleteMany({
        where: { userId },
      });

      res.json({
        success: true,
        message: `Deleted ${result.count} messages`,
      });
    } catch (error: any) {
      console.error('Clear history error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to clear history',
      });
    }
  }
}

export default new ChatController();
