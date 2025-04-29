// Replace the entire function with a version that returns lorem ipsum text

export async function generatePatentContent(
  subsectionType: string,
  patentContext: string
): Promise<string> {
  try {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Generate lorem ipsum text based on subsection type
    const loremIpsum = `# ${subsectionType}
  
  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam auctor, nisl eget ultricies tincidunt, nisl nisl aliquam nisl, eget ultricies nisl nisl eget nisl. Nullam auctor, nisl eget ultricies tincidunt, nisl nisl aliquam nisl, eget ultricies nisl nisl eget nisl.
  
  ## Technical Details
  
  Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
  
  1. First technical aspect related to ${subsectionType}
  2. Second technical aspect with specific implementation details
  3. Third technical aspect with variations and alternatives
  
  ## Implementation Examples
  
  Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat:
  
  - Example implementation A with technical specifications
  - Example implementation B with alternative approach
  - Example implementation C with specific use cases
  
  ## Advantages
  
  The ${subsectionType} provides several advantages over existing solutions:
  
  1. Improved efficiency by at least 35% compared to conventional methods
  2. Enhanced reliability under varying operational conditions
  3. Reduced complexity in manufacturing and implementation
  4. Compatibility with existing systems and infrastructure
  
  ## Conclusion
  
  In conclusion, the ${subsectionType} represents a significant advancement in the field, offering substantial improvements in performance, reliability, and ease of implementation.`;

    return loremIpsum;
  } catch (error) {
    console.error("Error generating patent content:", error);
    throw new Error(
      `Failed to generate ${subsectionType}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
