import React, { useState, useRef } from 'react';
import { Flex, Box, Text, Heading, Button, Input, useColorModeValue, useToast } from '@chakra-ui/react';
import { useAuth } from '../../../AppContext'; // Adjust path as needed

const UploadResumeCard = ({ count, onUploadSuccess, url }) => {
    const { token } = useAuth();
    const cardBg = useColorModeValue('white', 'gray.700');
    const valueColor = useColorModeValue('gray.900', 'white');
    const toast = useToast();
    const fileInputRef = useRef(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleFileUpload = async (event) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;
        setIsLoading(true);
        const formData = new FormData();
        for (let i = 0; i < files.length; i++) { formData.append('resumes', files[i]); }
        try {
            const response = await fetch(`${url}/api/resumes/upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Upload failed.');
            toast({ title: 'Upload Successful', description: data.message, status: 'success', duration: 5000, isClosable: true });
            onUploadSuccess();
        } catch (error) {
            toast({ title: 'Upload Error', description: error.message, status: 'error', duration: 5000, isClosable: true });
        } finally {
            setIsLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };
    
    const triggerFileSelect = () => fileInputRef.current?.click();

    return (
        <Flex bg={cardBg} p={4} borderRadius="lg" boxShadow="sm" direction="column" justify="space-between" minH="130px">
            <Box>
                <Text fontSize="sm" color="gray.500">Uploaded Resumes</Text>
                <Heading size="md" color={valueColor}>{count.toLocaleString()}</Heading>
            </Box>
            <Input type="file" multiple ref={fileInputRef} onChange={handleFileUpload} display="none" />
            <Button colorScheme="green" w="full" mt={2} onClick={triggerFileSelect} isLoading={isLoading}>
                Upload Resumes
            </Button>
        </Flex>
    );
};

export default UploadResumeCard;