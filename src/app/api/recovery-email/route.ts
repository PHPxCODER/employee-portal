import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import authOptions from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { recoveryEmail } = await request.json();

    if (!recoveryEmail) {
      return NextResponse.json(
        { success: false, error: "Recovery email is required" },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recoveryEmail)) {
      return NextResponse.json(
        { success: false, error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Check if recovery email is different from primary email
    if (session.user.email && recoveryEmail.toLowerCase() === session.user.email.toLowerCase()) {
      return NextResponse.json(
        { success: false, error: "Recovery email must be different from your primary email" },
        { status: 400 }
      );
    }

    // Find user by username
    const user = await prisma.user.findUnique({
      where: { username: session.user.username },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Update user with recovery email and mark onboarding as complete
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        recoveryEmail,
        onboardingComplete: true,
        updatedAt: new Date(),
      },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "recovery_email_set",
        details: {
          recoveryEmail,
          previousRecoveryEmail: user.recoveryEmail,
          completedOnboarding: !user.onboardingComplete,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Recovery email set successfully",
      data: {
        recoveryEmail: updatedUser.recoveryEmail,
        onboardingComplete: updatedUser.onboardingComplete,
      },
    });

  } catch (error) {
    console.error("Recovery email setup error:", error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: "An unexpected error occurred" 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { username: session.user.username },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        recoveryEmail: true,
        onboardingComplete: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user,
    });

  } catch (error) {
    console.error("Get user info error:", error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: "An unexpected error occurred" 
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { recoveryEmail } = await request.json();

    if (!recoveryEmail) {
      return NextResponse.json(
        { success: false, error: "Recovery email is required" },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recoveryEmail)) {
      return NextResponse.json(
        { success: false, error: "Invalid email format" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { username: session.user.username },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Update recovery email
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        recoveryEmail,
        updatedAt: new Date(),
      },
    });

    // Log the change
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "recovery_email_updated",
        details: {
          newRecoveryEmail: recoveryEmail,
          previousRecoveryEmail: user.recoveryEmail,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Recovery email updated successfully",
      data: {
        recoveryEmail: updatedUser.recoveryEmail,
      },
    });

  } catch (error) {
    console.error("Recovery email update error:", error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: "An unexpected error occurred" 
      },
      { status: 500 }
    );
  }
}