import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  VStack,
  Heading,
  Text,
  Button,
  useColorModeValue,
  Container,
  SimpleGrid,
  Card,
  CardBody,
  CardHeader,
  Badge,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Alert,
  AlertIcon,
  Spinner,
  Center,
  useToast
} from '@chakra-ui/react';
import { ArrowBackIcon, AddIcon, ViewIcon, DeleteIcon } from '@chakra-ui/icons';
import { FaFileAlt, FaDownload, FaUpload, FaSearch } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AppContext';

const Resumes = ({ url }) => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const pageBg = useColorModeValue('gray.50', 'gray.900');
  const headingColor = useColorModeValue('gray.800', 'gray.200');
  const cardBg = useColorModeValue('white', 'gray.800');
  const cardBorder = useColorModeValue('gray.200', 'gray.700');

  const [resumes, setResumes] = useState([]);

  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [ocrModalOpen, setOcrModalOpen] = useState(false);
  const [ocrData, setOcrData] = useState({ fileName: '', ocrText: '' });
  const toast = useToast();

  const handleBack = () => {
    navigate('/admin');
  };

  const handleViewResume = async (resume) => {
    try {
      console.log('🔍 Attempting to view resume:', resume.resume_url);
      
      // First try to fetch the URL to check if it's accessible
      const response = await fetch(resume.resume_url, { method: 'HEAD' });
      
      if (response.ok) {
        // If accessible, open in new tab
        window.open(resume.resume_url, '_blank');
      } else {
        // If not accessible, try to get a signed URL from the backend
        console.log('❌ Direct URL not accessible, trying signed URL...');
        await getSignedUrlAndView(resume);
      }
    } catch (error) {
      console.error('❌ Error viewing resume:', error);
      toast({
        title: 'Error Viewing Resume',
        description: 'Unable to access the resume file. Please try downloading it instead.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleDownloadResume = async (resume) => {
    try {
      console.log('📥 Attempting to download resume:', resume.resume_url);
      
      // Try to fetch the file
      const response = await fetch(resume.resume_url);
      
      if (response.ok) {
        // Create blob and download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = resume.file_name || `resume_${resume.id}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        toast({
          title: 'Download Started',
          description: `Downloading ${resume.file_name}`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        // If not accessible, try to get a signed URL from the backend
        console.log('❌ Direct URL not accessible, trying signed URL...');
        await getSignedUrlAndDownload(resume);
      }
    } catch (error) {
      console.error('❌ Error downloading resume:', error);
      toast({
        title: 'Download Failed',
        description: 'Unable to download the resume file. Please try again later.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const getSignedUrlAndView = async (resume) => {
    try {
      const response = await fetch(`${url}/api/resumes/${resume.id}/signed-url`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        window.open(data.signedUrl, '_blank');
      } else {
        throw new Error('Failed to get signed URL');
      }
    } catch (error) {
      console.error('❌ Error getting signed URL:', error);
      toast({
        title: 'Access Error',
        description: 'Unable to access the resume file. Please contact support.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const getSignedUrlAndDownload = async (resume) => {
    try {
      const response = await fetch(`${url}/api/resumes/${resume.id}/signed-url`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        // Download using signed URL
        const downloadResponse = await fetch(data.signedUrl);
        const blob = await downloadResponse.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = resume.file_name || `resume_${resume.id}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
        
        toast({
          title: 'Download Started',
          description: `Downloading ${resume.file_name}`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        throw new Error('Failed to get signed URL');
      }
    } catch (error) {
      console.error('❌ Error downloading with signed URL:', error);
      toast({
        title: 'Download Failed',
        description: 'Unable to download the resume file. Please try again later.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setUploadFile(file);
    }
  };

  const handleUploadResume = async () => {
    if (!token) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to upload resumes.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    if (!uploadFile) {
      toast({
        title: 'No file selected',
        description: 'Please select a resume file to upload.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('resume', uploadFile);

      const response = await fetch(`${url}/api/resumes/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Resume uploaded successfully!',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        setUploadModalOpen(false);
        setUploadFile(null);
        
        // Show OCR result modal
        const uploadedResume = data.resume;
        setOcrData({
          fileName: uploadedResume.file_name,
          ocrText: uploadedResume.ocr || 'No text extracted from this file.'
        });
        setOcrModalOpen(true);
        
        // Refresh resumes list
        fetchResumes();
      } else {
        throw new Error(data.message || 'Upload failed');
      }
    } catch (error) {
      toast({
        title: 'Upload Failed',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteResume = async (resumeId, fileName) => {
    if (!token) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to delete resumes.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    // Confirm deletion
    if (!window.confirm(`Are you sure you want to delete "${fileName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`${url}/api/resumes/${resumeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Deleted',
          description: 'Resume deleted successfully!',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        // Refresh the resumes list
        fetchResumes();
      } else {
        throw new Error(data.message || 'Delete failed');
      }
    } catch (error) {
      toast({
        title: 'Delete Failed',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const fetchResumes = async () => {
    if (!token) {
      console.log('No token available, skipping API call');
      setLoading(false);
      return;
    }

    setLoading(true);
    console.log('🔄 Fetching resumes from:', `${url}/api/resumes`);
    
    try {
      const response = await fetch(`${url}/api/resumes`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      console.log('📡 Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📄 Received data:', data);
        
        // Ensure data is an array and has the expected structure
        if (Array.isArray(data)) {
          setResumes(data);
          console.log(`✅ Loaded ${data.length} resumes`);
        } else {
          console.error('Invalid data format received:', data);
          toast({
            title: 'Data Error',
            description: 'Invalid data format received from server.',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ API Error:', errorData);
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error fetching resumes:', error);
      toast({
        title: 'Failed to Load Resumes',
        description: error.message || 'Unable to fetch resumes. Please check your connection.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch resumes on component mount and when token changes
  useEffect(() => {
    fetchResumes();
  }, [token]);

  const filteredResumes = resumes.filter(resume => {
    const fileName = resume.file_name || resume.name || '';
    const matchesSearch = fileName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <Box minH="100vh" bg={pageBg}>
      <Container maxW="container.xl" py={8}>
        <VStack spacing={6} align="stretch">
          {/* Header */}
          <Flex align="center" justify="space-between">
            <Flex align="center" gap={4}>
              <IconButton
                aria-label="Go back"
                icon={<ArrowBackIcon />}
                onClick={handleBack}
                variant="ghost"
                size="lg"
              />
              <VStack align="start" spacing={1}>
                <Heading as="h1" fontSize="2xl" color={headingColor}>
                  Resume Management
                </Heading>
                <Text color="gray.600">
                  Manage and review submitted resumes
                </Text>
              </VStack>
            </Flex>
            
            <Button
              leftIcon={<AddIcon />}
              colorScheme="blue"
              size="lg"
              onClick={() => setUploadModalOpen(true)}
            >
              Upload Resume
            </Button>
          </Flex>

          {/* Stats Cards */}
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <Card bg={cardBg} borderColor={cardBorder}>
              <CardBody textAlign="center">
                <FaFileAlt size={24} color="#3182CE" />
                <Text fontSize="2xl" fontWeight="bold" mt={2}>
                  {resumes.length}
                </Text>
                <Text color="gray.600">Total Resumes</Text>
              </CardBody>
            </Card>
            
            <Card bg={cardBg} borderColor={cardBorder}>
              <CardBody textAlign="center">
                <FaUpload size={24} color="#38A169" />
                <Text fontSize="2xl" fontWeight="bold" mt={2}>
                  {resumes.filter(r => {
                    const today = new Date();
                    const uploadDate = new Date(r.uploaded_at);
                    return uploadDate.toDateString() === today.toDateString();
                  }).length}
                </Text>
                <Text color="gray.600">Uploaded Today</Text>
              </CardBody>
            </Card>
          </SimpleGrid>

          {/* Search */}
          <Flex gap={4} flexWrap="wrap">
            <Box flex="1" minW="200px">
              <FormControl>
                <FormLabel>Search Resumes</FormLabel>
                <Flex>
                  <Input
                    placeholder="Search by filename..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    borderRightRadius="none"
                  />
                  <IconButton
                    borderLeftRadius="none"
                    icon={<FaSearch />}
                    aria-label="Search"
                  />
                </Flex>
              </FormControl>
            </Box>
          </Flex>

          {/* Resumes List */}
          {loading ? (
            <Center py={8}>
              <Spinner size="xl" />
            </Center>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
              {filteredResumes.map((resume) => (
                <Card key={resume.id} bg={cardBg} borderColor={cardBorder}>
                  <CardHeader>
                    <Flex justify="space-between" align="center">
                      <VStack align="start" spacing={1} flex="1" overflow="hidden" mr={2}>
                        <Heading 
                          size="md" 
                          noOfLines={1} 
                          title={resume.file_name}
                          overflow="hidden"
                          textOverflow="ellipsis"
                          whiteSpace="nowrap"
                          width="100%"
                        >
                          {resume.file_name}
                        </Heading>
                        <Text 
                          color="gray.600" 
                          fontSize="xs"
                          noOfLines={1}
                          title={resume.mime_type}
                        >
                          {resume.mime_type}
                        </Text>
                      </VStack>
                      <Badge colorScheme="blue" flexShrink={0}>
                        Resume
                      </Badge>
                    </Flex>
                  </CardHeader>
                  
                  <CardBody>
                    <VStack spacing={3} align="stretch">
                      <Text fontSize="sm" color="gray.600">
                        Size: {(resume.file_size / 1024 / 1024).toFixed(2)} MB
                      </Text>
                      
                      <Text fontSize="xs" color="gray.500">
                        Uploaded: {new Date(resume.uploaded_at).toLocaleDateString()}
                      </Text>
                      
                      <Flex gap={2} justify="space-between" align="center">
                        <Button
                          size="sm"
                          leftIcon={<ViewIcon />}
                          onClick={() => handleViewResume(resume)}
                          flex="1"
                        >
                          View
                        </Button>
                        
                        <Button
                          size="sm"
                          leftIcon={<FaDownload />}
                          onClick={() => handleDownloadResume(resume)}
                          flex="1"
                        >
                          Download
                        </Button>
                        
                        <IconButton
                          size="sm"
                          colorScheme="red"
                          variant="outline"
                          icon={<DeleteIcon />}
                          aria-label="Delete resume"
                          onClick={() => handleDeleteResume(resume.id, resume.file_name)}
                        />
                      </Flex>
                    </VStack>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>
          )}

          {filteredResumes.length === 0 && !loading && (
            <Center py={8}>
              <VStack spacing={4}>
                <FaFileAlt size={48} color="#A0AEC0" />
                <Text fontSize="lg" color="gray.500">
                  No resumes found
                </Text>
                <Text color="gray.400">
                  Try adjusting your search criteria
                </Text>
              </VStack>
            </Center>
          )}
        </VStack>

        {/* Upload Resume Modal */}
        <Modal isOpen={uploadModalOpen} onClose={() => setUploadModalOpen(false)}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Upload Resume</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                <FormControl>
                  <FormLabel>Select Resume File</FormLabel>
                  <Input
                    type="file"
                    accept=".pdf,.doc,.docx,image/*"
                    onChange={handleFileSelect}
                  />
                  <Text fontSize="sm" color="gray.500" mt={2}>
                    Supported formats: PDF, DOC, DOCX, Images (JPG, PNG, etc.) - Max: 10MB
                  </Text>
                </FormControl>
                
                {uploadFile && (
                  <Box p={3} bg="gray.50" borderRadius="md" w="full">
                    <Text fontSize="sm">
                      <strong>Selected:</strong> {uploadFile.name}
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      Size: {(uploadFile.size / 1024 / 1024).toFixed(2)} MB
                    </Text>
                  </Box>
                )}
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={() => setUploadModalOpen(false)}>
                Cancel
              </Button>
              <Button 
                colorScheme="blue" 
                onClick={handleUploadResume}
                isLoading={uploading}
                loadingText="Uploading..."
              >
                Upload Resume
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* OCR Result Modal */}
        <Modal isOpen={ocrModalOpen} onClose={() => setOcrModalOpen(false)} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              <VStack align="start" spacing={1}>
                <Text>✅ OCR Completed</Text>
                <Text fontSize="sm" fontWeight="normal" color="gray.600">
                  {ocrData.fileName}
                </Text>
              </VStack>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4} align="stretch">
                <Alert status="success" borderRadius="md">
                  <AlertIcon />
                  Text extraction completed successfully!
                </Alert>
                
                <Box>
                  <Text fontWeight="bold" mb={2}>Extracted Text:</Text>
                  <Box
                    p={4}
                    bg={useColorModeValue('gray.50', 'gray.700')}
                    borderRadius="md"
                    maxH="400px"
                    overflowY="auto"
                    whiteSpace="pre-wrap"
                    fontSize="sm"
                    border="1px solid"
                    borderColor={useColorModeValue('gray.200', 'gray.600')}
                  >
                    {ocrData.ocrText || 'No text was extracted from this file.'}
                  </Box>
                  {ocrData.ocrText && (
                    <Text fontSize="xs" color="gray.500" mt={2}>
                      {ocrData.ocrText.length} characters extracted
                    </Text>
                  )}
                </Box>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button colorScheme="blue" onClick={() => setOcrModalOpen(false)}>
                Close
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Container>
    </Box>
  );
};

export default Resumes;
